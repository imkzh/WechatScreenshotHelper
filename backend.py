import os
import io
import argparse
import stat


extension_root, script_name = os.path.split(__file__)
backend_script = os.path.join(extension_root, "backend", "capture_backend.py")
startup_script_location = "/etc/profile.d/wechat-capture-backend.sh"

def parse_args():
    par = argparse.ArgumentParser()
    par.add_argument("command", choices=["enable", "install", "disable", "uninstall"])
    
    args = par.parse_args()
    return args
    
def main():
    args = parse_args()
    
    if args.command in ["enable", "install"]:

        try:
            f = io.open(startup_script_location, "w")
        except PermissionError as ex:
            print("You should be root to execute this.")
            return
        
        start_up_code = [
            "#!/bin/bash",
            'nohup setsid python3 "{}" > /dev/null &'.format(backend_script),
            ""
        ]
        
        f.write("\n".join(start_up_code))
        f.close()
        os.chmod(startup_script_location, stat.S_IRWXU)
        os.system("bash " + startup_script_location)
    else:
        try:
       
            os.remove(startup_script_location)
        except PermissionError as ex:
            print("You should be root to execute this.")
            return


if __name__ == "__main__":
    main()

