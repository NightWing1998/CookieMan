module.exports = {
	roots: ['src/'],
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},
	testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	testPathIgnorePatterns: [
		"(build|docs|node_modules)"
	],
	coverageReporters : ["html","json"],
	collectCoverage: true,
	coverageDirectory: "./coverage",
	testEnvironment: "node"
}
