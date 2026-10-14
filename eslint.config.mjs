import nextConfig from "eslint-config-next";

const eslintConfig = [
  {
    ignores: [".worktrees/**", ".next/**", "out/**", "build/**"],
  },
  ...nextConfig,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "@next/next/no-location-assign-relative-destination": "off",
    },
  },
];

export default eslintConfig;
