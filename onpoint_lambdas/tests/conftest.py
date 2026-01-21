import importlib.util
import sys
from pathlib import Path


def add_common_to_path():
    root = Path(__file__).resolve().parents[1]
    common_path = root / "common" / "python"
    if str(common_path) not in sys.path:
        sys.path.insert(0, str(common_path))


def load_lambda_module(module_name: str, file_path: Path):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


class DummyClient:
    def __init__(self, **methods):
        self._methods = methods

    def __getattr__(self, name):
        if name in self._methods:
            return self._methods[name]
        raise AttributeError(name)
