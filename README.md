# Compiler of Android for Lona

This is the official `Android` plugin for the Lona compiler.

It was created as a collaborative effort between Target and [dabbott](https://github.com/dabbott) (the original author of Lona).

## Overview

[Lona](https://github.com/airbnb/Lona) is a collection of tools for building design systems and using them to generate cross-platform UI code, Sketch files, and other artifacts.

Lona comes in 2 main parts:

- **Lona Studio**: A Mac app for defining the design system
- **Lona compiler**: A CLI tool for generating artifacts from the design system definition.

This project is a plugin to the Lona compiler, providing support for Android code generation.

## How it works

The Lona compiler transforms the tokens, assets, and components defined in a Lona workspace into Android XML files and Kotlin classes.

These docs describe how each kind of definition is transformed in more detail:

- [Tokens](docs/Tokens.md)
- [Vector Assets](docs/Vector%20Assets.md)
- [Components](docs/Components.md)
