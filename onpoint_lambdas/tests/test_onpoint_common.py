from .helpers import add_common_to_path


def setup_module(module):
    add_common_to_path()


class TestOnpointCommonImports:
    """Smoke tests to verify onpoint_common module can be imported."""

    def test_import_onpoint_common(self):
        """Test that onpoint_common package can be imported."""
        import onpoint_common
        assert onpoint_common is not None

    def test_import_logging_util(self):
        """Test that loggingutil can be imported from onpoint_common."""
        from onpoint_common.loggingutil import get_logger
        assert get_logger is not None

    def test_import_envelope(self):
        """Test that envelope utilities can be imported from onpoint_common."""
        from onpoint_common.envelope import (
            build_ingress_envelope,
            resolve_partition_key,
            resolve_provider_id,
            safe_json_object_loads,
            byte_len_utf8,
        )
        assert all([
            build_ingress_envelope,
            resolve_partition_key,
            resolve_provider_id,
            safe_json_object_loads,
            byte_len_utf8,
        ])

    def test_import_ids(self):
        """Test that IDs utilities can be imported from onpoint_common."""
        from onpoint_common.ids import gen_envelope_id
        assert gen_envelope_id is not None

    def test_import_tenant(self):
        """Test that tenant utilities can be imported from onpoint_common."""
        from onpoint_common.tenant import validate_tenant_id
        assert validate_tenant_id is not None

    def test_import_timeutil(self):
        """Test that timeutil can be imported from onpoint_common."""
        from onpoint_common.timeutil import current_iso_string
        assert current_iso_string is not None

    def test_import_validate(self):
        """Test that validate utilities can be imported from onpoint_common."""
        from onpoint_common.validate import validate_json_schema
        assert validate_json_schema is not None

    def test_get_logger_returns_valid_logger(self):
        """Test that get_logger returns a valid logger object."""
        from onpoint_common.loggingutil import get_logger
        logger = get_logger(__name__)
        assert logger is not None
        assert hasattr(logger, 'info')
        assert hasattr(logger, 'error')
        assert hasattr(logger, 'warning')
