import os
import io
import argparse
import stat


extension_root, script_name = os.path.split(__file__)
backend_script = os.path.abspath(os.path.join(extension_root, "backend", "capture_backend.py"))

startup_sh_script = os.path.abspath(os.path.join(extension_root, "wechathelperd.sh"))
service_conf_location = "/lib/systemd/system/wechathelperd.service"
desktop_startup_location = "~/.config/autostart/"
desktop_startup_name = "wechathelperd.desktop"

template_service = os.path.join(extension_root, "wechathelperd.service.template")
template_desktop = os.path.join(extension_root, "wechathelperd.desktop.template")
template_startup_sh = os.path.join(extension_root, "wechathelperd.sh.template")

HOSTNAME = "127.0.0.1"
PORT = 32728


def find_desktop_manager():
    if os.path.exists("/etc/X11/default-display-manager"):
        # Debian/Ubuntu
        with io.open("/etc/X11/default-display-manager") as f:
            dm = f.read()
          
    elif os.path.exists("/etc/sysconfig/desktop"):
        # RedHat/Fedora
        with io.open("/etc/sysconfig/desktop") as f:
            dm = f.read()
          
    elif os.path.exists("/etc/sysconfig/displaymanager"):
        # OpenSuSe
        with io.open("/etc/sysconfig/displaymanager") as f:
            dm = f.read()
    else:
        print ("Warning: Desktop manager not recongized and the backend may start before your desktop envrionment is ready(doesn't really matter though),"
               " you can specify the desktop manager manually by adding --desktop-manager=<NAME> to commandline arg.")
        return ""
        
    dmpath, dmname = os.path.split(dm.strip())
    return dmname
    

def parse_args():
    par = argparse.ArgumentParser()
    par.add_argument("command", choices=["install", "uninstall"])
    par.add_argument("--desktop-manager", type=str)
    par.add_argument("--display", type=str)
    args = par.parse_args()
    return args


def install_systemd(args, mappings):
    """
    Install the backend as a systemd service.
    (this will not work because backend will fail to invoke subprocess from daemon.)
    """

    # read template and fill in parameters.
    with io.open(template_service, "r") as f:
        service = f.read()
    
    with io.open(template_startup_sh, "r") as f:
        startup_sh = f.read()

    service = service.format(**mappings)
    startup_sh = startup_sh.format(**mappings)

    # write startup script.
    try:
        of = io.open(startup_sh_script, "w")
    except PermissionError as ex:
        print("You should be root to execute this.")
        exit(1)

    of.write(startup_sh)
    of.flush()
    of.close()

    os.chmod(startup_sh_script, stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)  # 0755
    os.system('chmod +x "{:s}"'.format(startup_sh_script))
    print(startup_sh_script)
    # register service.
    try:
        of = io.open(service_conf_location, "w")
    except PermissionError as ex:
        print("You should be root to execute this.")
        exit(1)
    of.write(service)
    of.flush()
    of.close()
    os.chmod(service_conf_location, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)  # 0644

    print("Install complete")
    os.system("systemctl daemon-reload")
    print("unmask")
    os.system("systemctl unmask wechathelperd.service")
    print("enable")
    os.system("systemctl enable wechathelperd.service")
    print("start")
    os.system("systemctl start wechathelperd.service")
    print("doe")


def uninstall_systemd(args, mappings):
    os.system("systemctl stop wechathelperd.service")
    try:
        if os.path.exists(service_conf_location):
            os.remove(service_conf_location)
        else:
            print("Backend service is not installed at this time.")
    except PermissionError as ex:
        print("You should be root to execute this.")
        exit(1)

    print("Uninstall complete")


def install(args, mappings):
    
    # read template and fill in parameters.
    loc = os.path.expanduser(desktop_startup_location)
    os.makedirs(loc, exist_ok=True)

    # read startup script and fill the parameters.
        # read template and fill in parameters.
    with io.open(template_startup_sh, "r") as f:
        startup_sh = f.read()

    startup_sh = startup_sh.format(**mappings)

    # write startup script.
    with io.open(startup_sh_script, "w") as of:
        of.write(startup_sh)

    os.chmod(startup_sh_script, stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)  # 0755

    # read .desktop file template and fill the parameters.
    with io.open(template_desktop, "r") as f:
        template = f.read()
    template = template.format(**mappings)

    of_path = os.path.join(loc, desktop_startup_name)
    with io.open(of_path, "w") as f:
        f.write(template)

    print("Starting backend ...")
    # call start script to start the backend. 
    os.system('"{:}" start'.format(startup_sh_script))

    print("Install complete!")


def uninstall(args, mappings):

    loc = os.path.expanduser(desktop_startup_location)
    of_path = os.path.join(loc, desktop_startup_name)

    print("Stopping backend ...")
    os.system('"{:}" stop'.format(startup_sh_script))

    if os.path.exists(of_path):
        os.remove(of_path)
    else:
        print("Backend service is not installed at this time.")
    
    print("Uninstall complete!")


def main():
    args = parse_args()

    if args.desktop_manager is None:
        args.desktop_manager = find_desktop_manager()
    
    if args.display is None:
        args.display = os.environ["DISPLAY"] if "DISPLAY" in os.environ else ":0"
    
    mappings = {
        "dm": args.desktop_manager,
        "display": args.display,
        "hostname": HOSTNAME,
        "port": PORT,
        "shell_script": startup_sh_script,
        "backend_script": backend_script
    }

    if args.command == "install":
        install(args, mappings)
    elif args.command == "uninstall":
        uninstall(args, mappings)

if __name__ == "__main__":
    main()

