import json
import logging
from typing import Any, Dict, Optional
from urllib.parse import urljoin

import requests

from .retry import retry

logger = logging.getLogger(__name__)


class ApiClient:
    def __init__(self, base_url: str, api_key: str, timeout: float = 10.0, default_headers: Optional[Dict[str, str]] = None):
        self.base_url = base_url.rstrip("/") + "/"
        self.api_key = api_key
        self.timeout = timeout
        self.default_headers = default_headers or {}

    def _headers(self, extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        headers = {"x-api-key": self.api_key}
        headers.update(self.default_headers)
        if extra:
            headers.update(extra)
        return headers

    def request(self, method: str, path: str, *, headers: Optional[Dict[str, str]] = None, json_body: Optional[dict] = None, params: Optional[dict] = None):
        url = urljoin(self.base_url, path.lstrip("/"))
        resp = requests.request(
            method,
            url,
            headers=self._headers(headers),
            json=json_body,
            params=params,
            timeout=self.timeout,
        )
        return resp

    def request_with_retry(self, method: str, path: str, *, headers: Optional[Dict[str, str]] = None, json_body: Optional[dict] = None, params: Optional[dict] = None):
        def _do():
            resp = self.request(method, path, headers=headers, json_body=json_body, params=params)
            if resp.status_code in (429, 500, 502, 503, 504):
                raise RuntimeError(f"Retryable status {resp.status_code}")
            return resp

        return retry(_do)


def dump_response(resp: requests.Response) -> str:
    try:
        body = resp.json()
        payload = json.dumps(body, indent=2, default=str)
    except Exception:
        payload = resp.text
    return f"status={resp.status_code} body={payload}"
