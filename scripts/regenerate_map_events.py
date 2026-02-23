import json
import subprocess
from typing import Any, Dict, List, Optional, Tuple

REGION = "us-east-1"
TRIP_TABLE = "onpoint-dev-trip-summary"
QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/518761466197/onpoint-dev-trip-summary-queue"
SOURCE = "bulk-map-regeneration-2026-02-23"


def run_cmd(cmd: List[str]) -> Dict[str, Any]:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"Command failed: {' '.join(cmd)}")
    return json.loads(result.stdout)


def scan_trip_summaries() -> List[Dict[str, Any]]:
    all_items: List[Dict[str, Any]] = []
    last_evaluated_key: Optional[Dict[str, Any]] = None

    while True:
        cmd = [
            "aws",
            "dynamodb",
            "scan",
            "--region",
            REGION,
            "--table-name",
            TRIP_TABLE,
            "--projection-expression",
            "PK, SK, summary",
            "--output",
            "json",
        ]
        if last_evaluated_key:
            cmd.extend(["--exclusive-start-key", json.dumps(last_evaluated_key)])

        payload = run_cmd(cmd)
        all_items.extend(payload.get("Items", []))
        last_evaluated_key = payload.get("LastEvaluatedKey")
        if not last_evaluated_key:
            break

    return all_items


def classify_affected(items: List[Dict[str, Any]]) -> List[Tuple[str, str, str]]:
    affected: Dict[Tuple[str, str], str] = {}

    for item in items:
        pk = item.get("PK", {}).get("S", "")
        sk = item.get("SK", {}).get("S", "")
        if not pk.startswith("VEHICLE#") or not sk.startswith("TRIP_SUMMARY#"):
            continue

        vin = pk.replace("VEHICLE#", "", 1)
        trip_id = sk.replace("TRIP_SUMMARY#", "", 1)
        summary_raw = item.get("summary", {}).get("S")

        if not summary_raw:
            affected[(vin, trip_id)] = "missing_summary"
            continue

        try:
            summary = json.loads(summary_raw)
        except Exception:
            affected[(vin, trip_id)] = "invalid_summary_json"
            continue

        map_obj = summary.get("map")
        if not isinstance(map_obj, dict):
            affected[(vin, trip_id)] = "missing_map"
            continue

        sampled = map_obj.get("sampledPath") or []
        snapped = map_obj.get("snappedPath") or []

        if len(sampled) > 0 and len(snapped) == 0:
            affected[(vin, trip_id)] = "no_snapped"

    return [(vin, trip_id, reason) for (vin, trip_id), reason in affected.items()]


def enqueue_regeneration(records: List[Tuple[str, str, str]]) -> Tuple[int, int, List[Dict[str, str]]]:
    sent = 0
    failed = 0
    failed_items: List[Dict[str, str]] = []

    for vin, trip_id, reason in records:
        body = {
            "vin": vin,
            "tripId": trip_id,
            "provider": "manual-debug",
            "source": SOURCE,
            "reason": reason,
        }

        cmd = [
            "aws",
            "sqs",
            "send-message",
            "--region",
            REGION,
            "--queue-url",
            QUEUE_URL,
            "--message-body",
            json.dumps(body),
            "--output",
            "json",
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            sent += 1
        else:
            failed += 1
            failed_items.append(
                {
                    "vin": vin,
                    "tripId": trip_id,
                    "reason": reason,
                    "error": (result.stderr or "").strip()[:300],
                }
            )

    return sent, failed, failed_items


def main() -> None:
    items = scan_trip_summaries()
    affected = classify_affected(items)
    sent, failed, failed_items = enqueue_regeneration(affected)

    output = {
        "scanned_items": len(items),
        "affected_unique": len(affected),
        "messages_sent": sent,
        "messages_failed": failed,
        "sample_affected": [
            {"vin": vin, "tripId": trip_id, "reason": reason}
            for vin, trip_id, reason in affected[:20]
        ],
        "failed_sample": failed_items[:10],
    }
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
