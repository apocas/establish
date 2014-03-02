establish
=========

Establish, a nodejs stupid simple git and ssh based deployment tool.


## Installation

`npm install -g establish`

## Usage

 * establish deploy file.json

### Getting started

To use `dockerode` first you need to instantiate it:

``` json
[
  {
    "name": "project1",
    "tag": "v0.2",
    "repo": "git@github.com:apocas/establish.git",
    "user": "john",
    "host": "192.168.1.1",
    "destination": "/home/john/project1",
  },
  {
    "name": "project2",
    "tag": "v0.1",
    "repo": "git@github.com:apocas/establish.git",
    "user": "john",
    "host": "192.168.1.2",
    "destination": "/home/john/project2",
    "env": {
      "JOHN": "doe"
    },
    "runscript": "customstart",
    "run": "false",
    "installscript": "custominstall"
  }
]
```

## License

Pedro Dias <abru.pt>

Licensed under the Apache license, version 2.0 (the "license"); You may not use this file except in compliance with the license. You may obtain a copy of the license at:

    http://www.apache.org/licenses/LICENSE-2.0.html

Unless required by applicable law or agreed to in writing, software distributed under the license is distributed on an "as is" basis, without warranties or conditions of any kind, either express or implied. See the license for the specific language governing permissions and limitations under the license.
