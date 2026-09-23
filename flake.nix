{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.11";
    # 25.11's wrangler fails on Hydra, so it is absent from cache.nixos.org and
    # every shell would build the whole workers-sdk monorepo from source.
    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    nixpkgs,
    nixpkgs-unstable,
    flake-utils,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
      unstable = nixpkgs-unstable.legacyPackages.${system};
    in {
      devShells.default = pkgs.mkShell {
        packages = [
          pkgs.nodejs_24
          pkgs.pnpm
          pkgs.git
          unstable.wrangler
        ];

        WRANGLER_SEND_METRICS = "false";

        shellHook = ''
          export PATH="$PWD/node_modules/.bin:$PATH"
        '';
      };
    });
}
