{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs
    pkgs.python311  # needed if you want yt-dlp-exec
    pkgs.git
  ];
}
