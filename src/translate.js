"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true,
});
const http = require("http");
const vscode = require("vscode");
const crypto = require("crypto");
const querystring = require("querystring");
const colors = require("colors");

const { table } = require("table");

class TextFilter {
  static filter(q) {
    q = q.replace(TextFilter.COMPILE, (e) => {
      return " " + e;
    });
    q = q.replace(TextFilter.COMPILE_CHAR, " ");
    q = q.replace(TextFilter.COMPILE_SPAN, " ");
    return q;
  }
}

TextFilter.COMPILE = /[A-Z]{1}[a-z]+/g;
TextFilter.COMPILE_CHAR = /[-_\n\r\t*]/g;
TextFilter.COMPILE_SPAN = /[\ ]+/g;
class Translate {
  constructor(out) {
    this.appKey = "";
    this.appSecret = "";
    this.out = out;
  }
  md5(content) {
    let md5 = crypto.createHash("md5");
    md5.update(content);
    let req = md5.digest("hex");
    return req;
  }
  sign(a, s) {
    let signStr = a.appKey + a.q + a.salt + s;
    a.sign = this.md5(signStr).toUpperCase();
  }
  guid() {
    let a = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      let r = (Math.random() * 16) | 0;
      let v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    return a;
  }

  async fy(q, target) {
    const request = {
      q: "",
      from: Translate.Lang.EN,
      to: target,
      appKey: "",
      salt: "",
      sign: "",
    };
    request.q = TextFilter.filter(q);
    request.salt = this.guid();
    request.appKey = this.appKey;

    this.sign(request, this.appSecret);
    let reqUrl = Translate.API_URL + querystring.stringify(request);

    return await new Promise((resolve, reject) => {
      http
        .get(reqUrl, (res) => {
          const { statusCode } = res;
          const contentType = res.headers["content-type"];
          let error;
          if (statusCode !== 200) {
            error = new Error("请求失败。\n" + `状态码: ${statusCode}`);
          } else if (
            contentType === undefined ||
            !/^application\/json/.test(contentType)
          ) {
            error = new Error(
              "无效的 content-type.\n" +
                `期望 application/json 但获取的是 ${contentType}`
            );
          }
          if (error) {
            console.error(error.message);
            vscode.window.showInformationMessage(`错误: ${error.message}`);
            // 消耗响应数据以释放内存
            res.resume();
            return;
          }
          res.setEncoding("utf8");
          let rawData = "";
          res.on("data", (chunk) => {
            rawData += chunk;
          });
          res.on("end", () => {
            try {
              const parsedData = JSON.parse(rawData);

              if (parsedData.errorCode !== "0") {
                let msg = Translate.ErrorCode[parsedData.errorCode];
                parsedData.errorMsg = msg !== undefined ? msg : "";
                vscode.window.showInformationMessage(parsedData.errorMsg);
              } else {
                let web = parsedData.web;
                let extra = web?.map((el) => [el.key, el.value]);

                const config = {
                  border: {
                    topBody: `─`,
                    topJoin: `┬`,
                    topLeft: `┌`,
                    topRight: `┐`,

                    bottomBody: `─`,
                    bottomJoin: `┴`,
                    bottomLeft: `└`,
                    bottomRight: `┘`,

                    bodyLeft: `│`,
                    bodyRight: `│`,
                    bodyJoin: `│`,

                    joinBody: `─`,
                    joinLeft: `├`,
                    joinRight: `┤`,
                    joinJoin: `┼`,
                  },
                };

                const innerConfig = {
                  border: {
                    topBody: ``,
                    topJoin: ``,
                    topLeft: ``,
                    topRight: ``,

                    bottomBody: ``,
                    bottomJoin: ``,
                    bottomLeft: ``,
                    bottomRight: ``,

                    bodyLeft: ``,
                    bodyRight: ``,
                    bodyJoin: ``,

                    joinBody: ``,
                    joinLeft: ``,
                    joinRight: ``,
                    joinJoin: ``,
                  },
                };

                const data = [
                  ["原文", request.q],
                  ["结果", parsedData.translation],
                  ["词义", extra ? table(extra, innerConfig) : null],
                ];

                this.out.appendLine(table(data, config).green);

                resolve(parsedData.translation);
              }
            } catch (e) {
              console.error(e.message);
              vscode.window.showInformationMessage(e.message);
            }
          });
        })
        .on("error", (e) => {
          console.error(`错误: ${e.message}`);
          vscode.window.showInformationMessage(`错误: ${e.message}`);
        });
    });
  }
  async translate(content, target) {
    let settings = vscode.workspace.getConfiguration();
    //let settings = vscode.workspace.getConfiguration('cpplint');
    this.appKey = settings.get("vampire.translate.youdao.appKey", "");
    this.appSecret = settings.get("vampire.translate.youdao.appSecret", "");
    if (this.appSecret && this.appKey) {
      if (content) {
        return await this.fy(content, target);
      }
    } else {
      vscode.window.showErrorMessage("需要配置有道翻译 appKey 和 appSecret !");
    }
  }
}
Translate.API_URL = "http://openapi.youdao.com/api?";
Translate.r1 = "";
Translate.ErrorCode = {
  101: "缺少必填的参数",
  102: "不支持的语言类型",
  103: "翻译文本过长",
  104: "不支持的API类型",
  105: "不支持的签名类型",
  106: "不支持的响应类型",
  107: "不支持的传输加密类型",
  108: "appKey无效",
  109: "batchLog格式不正确",
  110: "无相关服务的有效实例",
  111: "开发者账号无效",
  113: "q不能为空",
  201: "解密失败，可能为DES,BASE64,URLDecode的错误",
  202: "签名检验失败",
  203: "访问IP地址不在可访问IP列表",
  205: "请求的接口与应用的平台类型不一致",
  301: "辞典查询失败",
  302: "翻译查询失败",
  303: "服务端的其它异常",
  401: "账户已经欠费",
  411: "访问频率受限,请稍后访问",
  412: "长请求过于频繁，请稍后访问",
};
Translate.Lang = {
  "zh-CHS": "中文",
  ja: "日文",
  EN: "英文",
  ko: "韩文",
  fr: "法文",
  ru: "俄文",
  pt: "葡萄牙文",
  es: "西班牙文",
  vi: "越南文",
};
exports.Translate = Translate;
//# sourceMappingURL=translate.js.map
