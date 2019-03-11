# WechatScreenshotHelper

Source code for firefox extension: **Wechat Screenshot Capture Helper(Ubuntu)**
This repository contains both source code of uploaded extension and screenshot backend.

## Download and Install Firefox Extension
Download Firefox extension file(.xpi) here: [Release_1.1](https://github.com/imkzh/WechatScreenshotHelper/releases/tag/r1.1)

Drag-and-drop the `.xpi` file you downloaded into Firefox, and select `Add` when it prompts.

## Configure Backend

To enable the backend, clone this repository and enable it:

    cd /path/to/store/the/code
    git clone https://github.com/imkzh/WechatScreenshotHelper
    cd WechatScreenshotHelper
    sudo python3 ./backend.py enable


(After enabling the backend, it will automatically start with system.)

### Note: 
* you will need both `Firefox Extension` and `This Repository` configured for screenshot button to be functional.
* If you moved your installation, please run it again.
* **Keep** the source after install, because we are actually calling it from a generated script in `/etc/profile.d`
* You also need ImageMagick installed for screenshot functionality. Check it with `which import`, if it returned nothing, you probably have not installed ImageMagick yet, invoke apt to get it: `sudo apt install imagemagick`

## Uninstall

Remove extension from Firefox and then:

    cd /path/to/store/the/code
    cd WechatScreenshotHelper
    sudo python3 ./backend.py disable


* An optional reboot is recommended, because after `disable`, backend script is **still running**, you can also kill it manually, it is a `python3` process with commandline `capture_backend.py`

## Cares to be Taken:
* Use this tool gracefully, **DO NOT** abuse this, because Tencent(Wechat) **MAY BAN YOUR ACCOUNT WITHOUT ANY WARNING**. I took no responsibility if you got blacklisted.
* the backend is actually using a file at `/tmp/firefox-screenshot.png` and a TCP Socket on port `32728`. The backend server is hand made(by myself) and may not secure enough, but we are listening **only for local connections** and requiring an special `access_key`, so it is not that dangerous.
* I have tested it under `Ubuntu16.04` with `Firefox 65.0.1`, but not sure if it works on other linux distro (theoretically it should).

