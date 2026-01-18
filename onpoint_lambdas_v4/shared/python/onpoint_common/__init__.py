"""Shared helpers for OnPointAI Lambdas.

This folder is intended to be published as a Lambda Layer:
  zip -r shared-layer.zip python/

With the layer attached to a Lambda, these imports work:
  from onpoint_common.timeutil import utc_now_iso
"""
