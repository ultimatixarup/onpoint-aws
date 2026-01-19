from __future__ import annotations

import logging
import os


def get_logger(name: str = "") -> logging.Logger:
    """Create a logger with consistent level across lambdas."""
    logger = logging.getLogger(name)
    level_s = os.environ.get("LOG_LEVEL", "INFO").upper().strip()
    level = getattr(logging, level_s, logging.INFO)
    logger.setLevel(level)
    return logger
