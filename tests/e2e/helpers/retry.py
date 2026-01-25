import time
from typing import Callable, Iterable, Optional, Type


def retry(
    fn: Callable[[], object],
    *,
    retries: int = 6,
    base_delay: float = 0.5,
    max_delay: float = 8.0,
    retry_on: Optional[Callable[[Exception], bool]] = None,
    retry_on_result: Optional[Callable[[object], bool]] = None,
):
    attempt = 0
    delay = base_delay
    while True:
        try:
            result = fn()
            if retry_on_result and retry_on_result(result):
                raise RuntimeError("Retryable result")
            return result
        except Exception as exc:  # noqa: BLE001
            attempt += 1
            if retry_on and not retry_on(exc):
                raise
            if attempt > retries:
                raise
            time.sleep(delay)
            delay = min(delay * 2, max_delay)
