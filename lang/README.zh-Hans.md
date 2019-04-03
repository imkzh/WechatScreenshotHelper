# WechatScreenshotHelper 网页微信截图助手
欢迎使用`网页微信截图助手`（虽然我真的不是很喜欢`助手`这个词）。

# 安装方法

## 第一步： 下载并安装浏览器插件

下载对应浏览器的浏览器插件，然后安装到浏览器中：

### 火狐用户
* 访问[此处](https://github.com/imkzh/WechatScreenshotHelper/releases/tag/r2.0.3)下载最新版的Firefox插件文件(`.xpi`)。
* 将下载的插件文件(`.xpi`)拖入浏览器中。
* 在浏览器提示是否安装时选择`添加`。

### Chrome用户
* 访问[此处](https://github.com/imkzh/WechatScreenshotHelper/releases/tag/r2.0.3)下载Google Chrome插件文件(`.crx`)。
* 在浏览器地址栏里输入`chrome://extensions`，打开插件页面。
* 将刚才下载的文件拖入页面中。
* 浏览器提示是否安装时选择`添加`。

## 第二步. 配置截图后端

### 2.1 下载后端代码

按`ctrl+alt+t`打开终端，`clone`这个项目:

    git clone https://github.com/imkzh/WechatScreenshotHelper

> 注: 如果提示git没有安装，需要`sudo apt install git`

### 2.2 安装后端

安装截图工具后端:

    cd WechatScreenshotHelper
    python3 ./config.py install

> 注: 安装时，安装脚本将开启后端，并配置后端随系统自动启动。

### 注意事项: 

* 上述步骤必须全部完成，网页微信上的截图按钮才会起作用。
* 安装后请不要移动或删除clone下来的代码，如果移动，请重新执行2.2配置后端。
* 如果上述步骤均成功，但是无法截图，请确认电脑上有`gnome-screenshot`这个命令行工具（在终端中执行`which gnome-screenshot`如果有输出则已安装）。

## 卸载

打开终端，输入以下命令来卸载后端:

    cd WechatScreenshotHelper
    python3 ./config.py uninstall

如果你不准备继续使用截图工具，请不要忘记删除浏览器插件（插件管理页面：Chrome浏览器`chrome://extensions`，火狐浏览器`about:addons`）。

## 其他重要事项:

* 请**合理**使用本工具, **不要**滥用, 因为企鹅可能会因为这个**直接ban你的帐号**，而且众所周知，你是找不到企鹅的客服的。
* 后端截图工具会将截图文件临时保存在 `/tmp/firefox-screenshot.png` 下,请确认`/tmp`目录具有写入权限，
* 后端截图工具使用`32728`端口来和网页微信通信，请确认该端口没有被占用。
* 本工具在`Ubuntu16.04` + `Firefox 65.0.1`/`Chrome 73.0.3683.86`下测试通过，虽然理论上来说也支持其他浏览器和其他Linux系统，但是并不确定，欢迎发Issue告诉我你在使用中遇到的问题。

# 许可信息

本项目代码通过GPLv3开源。

另外，本项目中的所有图标和图片文件通过Creative Commons Attribution-NonCommercial 4.0 International发布。

![licicons](http://i.creativecommons.org/l/by-nc/4.0/88x31.png "Creative Commons License")

# 关于用户隐私

本工具尊重您的个人隐私（**即使**您认为可以通过隐私信息换取一些便利），本项目**不会**在没有您的许可的情况下**收集**或**发送**您的（包括但不限于）`个人信息`、`聊天记录`、`通信列表`、`使用习惯`等隐私数据。目前本项目中没有存在任何用于收集您的隐私数据的代码。
