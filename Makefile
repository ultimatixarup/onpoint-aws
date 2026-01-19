lint-cfn:
	cfn-lint -t cfn/root.yaml cfn/nested/*.yaml
