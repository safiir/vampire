# about vampire

vampire is a utility extension plugin based on vscode used to support multiple batch-processing operation parallelly like translating, sorting, reversing, uniquizing, capitalizing, shuffling, joining and more complicated & flexible processing via javascript.

## Features

|shortcut|explanation|
|-|-|
|`Ctrl + S`|sorting|
|`Ctrl + T`|translating|
|`Ctrl + C`|capitalizing|
|`Ctrl + U`|uniquizing|
|`Ctrl + K`|reversing|
|`Ctrl + Shift + S`|shuffling|
|`Ctrl + Shift + J`|joining|
|`Ctrl + M`|transform via arbitrary javascript expression eg. `$.toLowerCase()`|

***special predefined variable***
|variable|explanation|
|-|-|
|`$`|current line|
|`_`|a list splitted from blank characters|
|`$n`|n-th word splitted from blank characters|
|`R`|[Ramda.js library](https://ramda.cn/)|
## Extension Settings

* `vampire.translate.youdao.appKey`: youdao app key
* `vampire.translate.youdao.appSecret`: youdao app secret

## Release Notes
### 0.0.1
initial release