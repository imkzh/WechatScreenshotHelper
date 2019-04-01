# WechatScreenshotHelper

Source code for firefox extension: **Wechat Screenshot Capture Helper(Ubuntu)**

This repository contains both source code of uploaded extension and screenshot backend.
# Screenshot
![Screenshot1](https://raw.githubusercontent.com/imkzh/WechatScreenshotHelper/master/screenshot/screenshot.png "Wechat Screenshot Helper! Edit, confirm and send!")

# Release Note

## r2.0
This is a milestone! Download this extension at [Release 2.0.2](https://github.com/imkzh/WechatScreenshotHelper/releases/tag/r2.0.2).

### Improvements:
* Added support for "edit, confirm and send".
* Better backend(we are using `gnome-screenshot` now)
* Added screenshot editor!
    * added support for drawing lines.
    * added support for adding rectangles and arrows,
    * added support for adding texts. 
    * added support for changing text size.
* Added support for undo and redo while editing
* Code cleanups.
* Updated the instruction messages for cases when backend is not running correctly.

### Bugfixies:
* Backend now starts with system correctly.
* You can cancel the screenshot procedure now.



# Howto

## Step 1. Download and Install Firefox Extension
Download Firefox extension file(.xpi) here: [Release 2.0.2](https://github.com/imkzh/WechatScreenshotHelper/releases/tag/r2.0.2)

Drag-and-drop the `.xpi` file you downloaded into Firefox, and select `Add` when it prompts.

## Step 2. Config Backend

### Step 2.1 Get the Backend

clone this repository to get the backend:

    cd /path/to/store/the/code
    git clone https://github.com/imkzh/WechatScreenshotHelper

### Step 2.2 Install It

`install` the WechatScreenshotHelper backend with:

    cd WechatScreenshotHelper
    python3 ./config.py install

(After enabling the backend, it will automatically start with system.)

### Note: 

* you will need both `Firefox Extension` installed and `This Repository` configured for screenshot button to be functional.
* If you moved your installation, please configure it again.
* **Keep** the source after install, because we are actually calling it from a generated script in `~/.config/autostart`
* `gnome-screenshot` is required for screenshot to work.

## Uninstall

To uninstall the backend:

    cd /path/to/the/WechatScreenshotHelper
    python3 ./config.py uninstall

Remember to remove the extension from Firefox if you are not using this anymore.

## Cares to be Taken:

* Use this tool gracefully, **DO NOT** abuse this, because Tencent(Wechat) **MAY BAN YOUR ACCOUNT WITHOUT ANY WARNING**. I took no responsibility if you got blacklisted.
* the backend is actually using a file at `/tmp/firefox-screenshot.png` and a TCP Socket on port `32728`. The backend server is hand made(by myself) and may not secure enough, but we are listening **only for local connections** and is requiring an special `access_key` for important operations, so it is not that dangerous.
* I have tested it under `Ubuntu16.04` with `Firefox 65.0.1`, but not sure if it works on other linux distro (theoretically it should).

# Todo:
We are not stopping just at here. There are few plans in my mind now, but they're still blueprints.
