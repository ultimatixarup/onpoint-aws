#!/usr/bin/env python3
import argparse
import json
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from urllib import error, request


VAR_PATTERN = re.compile(r"{{\s*([^{}\s]+)\s*}}")


@dataclass
class TestCase:
    collection: str
    name: str
    url_template: str
    headers: Dict[str, str]


def load_postman_env(env_file: Path) -> Dict[str, str]:
    data = json.loads(env_file.read_text())
    values = data.get("values", [])
    out: Dict[str, str] = {}
    for item in values:
        key = item.get("key")
        value = item.get("value")
        if isinstance(key, str) and isinstance(value, str):
            out[key] = value
    return out


def extract_raw_url(url_obj) -> Optional[str]:
    if isinstance(url_obj, str):
        return url_obj
    if isinstance(url_obj, dict):
        raw = url_obj.get("raw")
        if isinstance(raw, str):
            return raw
    return None


def extract_headers(headers_obj) -> Dict[str, str]:
    headers: Dict[str, str] = {}
    if not isinstance(headers_obj, list):
        return headers
    for item in headers_obj:
        if not isinstance(item, dict):
            continue
        if item.get("disabled") is True:
            continue
        key = item.get("key")
        value = item.get("value")
        if isinstance(key, str) and isinstance(value, str):
            headers[key] = value
    return headers


def walk_items(collection_name: str, items, out: List[TestCase]):
    if not isinstance(items, list):
        return
    for item in items:
        if not isinstance(item, dict):
            continue
        request_obj = item.get("request")
        if isinstance(request_obj, dict):
            method = str(request_obj.get("method", "")).upper()
            if method == "GET":
                raw_url = extract_raw_url(request_obj.get("url"))
                if raw_url:
                    out.append(
                        TestCase(
                            collection=collection_name,
                            name=str(item.get("name", "Unnamed GET request")),
                            url_template=raw_url,
                            headers=extract_headers(request_obj.get("header")),
                        )
                    )
        walk_items(collection_name, item.get("item"), out)


def load_get_test_cases(postman_dir: Path) -> List[TestCase]:
    tests: List[TestCase] = []
    for file_path in sorted(postman_dir.glob("*.postman_collection.json")):
        try:
            data = json.loads(file_path.read_text())
        except Exception:
            continue
        collection_name = file_path.name
        walk_items(collection_name, data.get("item"), tests)
    return tests


def substitute_vars(template: str, values: Dict[str, str]) -> Tuple[Optional[str], Set[str]]:
    missing: Set[str] = set()

    def repl(match: re.Match[str]) -> str:
        key = match.group(1)
        if key in values and values[key] != "":
            return values[key]
        missing.add(key)
        return match.group(0)

    rendered = VAR_PATTERN.sub(repl, template)
    if missing:
        return None, missing
    return rendered, missing


def infer_default_headers(url: str, env: Dict[str, str]) -> Dict[str, str]:
    headers: Dict[str, str] = {}
    if env.get("tripSummaryBaseUrl") and url.startswith(env["tripSummaryBaseUrl"]):
        tenant = env.get("tripSummaryTenantId") or env.get("tenantId")
        if tenant:
            headers["x-tenant-id"] = tenant
        if env.get("role"):
            headers["x-role"] = env["role"]
    if env.get("fleetTenancyBaseUrl") and url.startswith(env["fleetTenancyBaseUrl"]):
        if env.get("tenantId"):
            headers["x-tenant-id"] = env["tenantId"]
    if env.get("vehicleStateBaseUrl") and url.startswith(env["vehicleStateBaseUrl"]):
        if env.get("tenantId"):
            headers["x-tenant-id"] = env["tenantId"]
    if env.get("geofencingBaseUrl") and url.startswith(env["geofencingBaseUrl"]):
        if env.get("tenantId"):
            headers["x-tenant-id"] = env["tenantId"]
    return headers


def expected_statuses(test_name: str) -> Set[int]:
    lower = test_name.lower()
    if "forbidden" in lower:
        return {403}
    if "missing api key" in lower:
        return {403}
    if "invalid vin" in lower:
        return {400}
    if "status is 200 or 404" in lower:
        return {200, 404}
    if "no summary" in lower and "detail" in lower:
        return {200, 404}
    if "get trip detail" in lower:
        return {200, 404}
    return {200}


def run_get(url: str, headers: Dict[str, str], timeout: int) -> Tuple[int, str]:
    req = request.Request(url=url, method="GET")
    for key, value in headers.items():
        req.add_header(key, value)
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            return resp.getcode(), body
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return exc.code, body


def body_smoke_check(body: str) -> bool:
    try:
        parsed = json.loads(body)
    except Exception:
        return False
    return isinstance(parsed, (dict, list))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run backend GET regression tests from Postman collections."
    )
    parser.add_argument(
        "--env-file",
        default="postman/onpoint-dev.postman_environment.json",
        help="Path to Postman environment JSON file",
    )
    parser.add_argument(
        "--postman-dir",
        default="postman",
        help="Path containing *.postman_collection.json",
    )
    parser.add_argument(
        "--collection-filter",
        default="",
        help="Only run collections containing this substring (case-insensitive)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=20,
        help="HTTP timeout seconds per request",
    )
    parser.add_argument(
        "--sleep-ms",
        type=int,
        default=0,
        help="Sleep between requests in milliseconds",
    )
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    env_file = (repo_root / args.env_file).resolve()
    postman_dir = (repo_root / args.postman_dir).resolve()

    if not env_file.exists():
        print(f"ERROR: env file not found: {env_file}")
        return 2
    if not postman_dir.exists():
        print(f"ERROR: postman dir not found: {postman_dir}")
        return 2

    env = load_postman_env(env_file)
    tests = load_get_test_cases(postman_dir)

    if args.collection_filter:
        filt = args.collection_filter.lower()
        tests = [t for t in tests if filt in t.collection.lower()]

    if not tests:
        print("No GET test cases found.")
        return 2

    passed = 0
    failed = 0
    skipped = 0

    print(f"Running {len(tests)} GET tests...\n")

    for idx, test in enumerate(tests, start=1):
        rendered_url, missing = substitute_vars(test.url_template, env)
        if not rendered_url:
            skipped += 1
            print(f"[{idx:03}] SKIP  {test.collection} :: {test.name}")
            print(f"      missing vars: {', '.join(sorted(missing))}")
            continue

        headers = infer_default_headers(rendered_url, env)
        rendered_headers: Dict[str, str] = {}
        missing_header_vars: Set[str] = set()
        for key, value in {**headers, **test.headers}.items():
            rendered_value, missing_h = substitute_vars(value, env)
            if rendered_value is None:
                missing_header_vars.update(missing_h)
                continue
            rendered_headers[key] = rendered_value

        if missing_header_vars:
            skipped += 1
            print(f"[{idx:03}] SKIP  {test.collection} :: {test.name}")
            print(
                f"      missing header vars: {', '.join(sorted(missing_header_vars))}"
            )
            continue

        expected = expected_statuses(test.name)
        status, body = run_get(rendered_url, rendered_headers, timeout=args.timeout)
        ok_status = status in expected
        ok_body = body_smoke_check(body)

        if ok_status and ok_body:
            passed += 1
            print(
                f"[{idx:03}] PASS  {test.collection} :: {test.name}"
                f" (status={status}, expected={sorted(expected)})"
            )
        else:
            failed += 1
            snippet = body[:240].replace("\n", " ")
            print(
                f"[{idx:03}] FAIL  {test.collection} :: {test.name}"
                f" (status={status}, expected={sorted(expected)}, body_json={ok_body})"
            )
            print(f"      url: {rendered_url}")
            print(f"      body: {snippet}")

        if args.sleep_ms > 0 and idx < len(tests):
            time.sleep(args.sleep_ms / 1000.0)

    print("\nSummary")
    print(f"  PASS: {passed}")
    print(f"  FAIL: {failed}")
    print(f"  SKIP: {skipped}")

    return 1 if failed > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
