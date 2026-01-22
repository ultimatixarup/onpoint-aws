from pathlib import Path


def test_ingest_api_template_has_telematics_path_and_sqs_integration():
    template_path = Path(__file__).resolve().parents[2] / "cfn" / "nested" / "ingest_api.yaml"
    content = template_path.read_text()

    ingest_index = content.find("PathPart: ingest")
    telematics_index = content.find("PathPart: telematics")

    assert ingest_index != -1
    assert telematics_index != -1
    assert ingest_index < telematics_index

    assert "integration.request.header.Content-Type: \"'application/x-www-form-urlencoded'\"" in content
    assert "Action=SendMessage" in content
    assert "MessageAttribute.1.Name=providerId" in content
