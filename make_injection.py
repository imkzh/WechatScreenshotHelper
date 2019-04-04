import io
import re
import base64
import os


def preprocess(path):
    r"""
    Simple script preprocessor
    (Bug: This will possibly break quote pairs).
    
        Matches tokens with following syntax:
        "$" tokenName ["<" tokenOption ">"] "(" paramList ")"

        eg. "$include<dataurl>(./images/check.svg, images/svg+xml)" 
            -- include another file as base64 encoded dataurl with specified mime type

            "$include(./pages/foot.html)"
            -- include another file.

            "$include<raw>(./pages/header.html)"
            -- include another file directly, without any preprocessing.
    """

    if not os.path.isfile(path) or os.path.isdir(path):
        return None

    with io.open(path, "r") as f:
        
        file = f.read()

        tokens = re.compile(r"\$([a-zA-Z_]+)(?:(?:\<)(.*?)(?:\>)){,1}\((.+?)\)")

        m = tokens.search(file)
        while m:
            grps = m.groups()
            # print(grps)
            matchend = m.end()

            if grps[0] == "include":
                # $include(path)  -- include another file as a part of this file,.
                # $include<dataurl>(path, mime_type)  -- include file as dataurl

                include_file = grps[2].split(",", 1)[0]
                if grps[1] is None or "raw" not in grps[1]:
                    
                    inc_txt = preprocess(include_file)

                    if inc_txt is None:
                        print("Error: Failed to open include file: '", include_file, "', while processing: '", path, "'", sep="")
                        return None

                    if grps[1] is not None and "dataurl" in grps[1]:
                        sp = grps[2].split(",")
                        if len(sp) > 1:
                            inc_txt = "data:" + sp[-1].strip() + ";base64," + base64.b64encode(inc_txt.encode()).decode()
                        else:
                            inc_txt = "data:text/plain;base64," + base64.b64encode(inc_txt.encode()).decode()
                    
                    if grps[1] is not None and "single-line" in grps[1]:
                        inc_txt = inc_txt.replace("\n", "")
                
                else:
                    try:
                        with io.open(include_file, "r") as inc_f:
                            inc_txt = inf_f.read()
                    except FileNotFoundError:
                        print("Error: Failed to open include file: '", include_file, "', while processing: '", path, "'", sep="")
                        return None

                file = file[:m.start()] + inc_txt + file[m.end():]
                matchend = m.start() + len(inc_txt)

            else:
                print("Unknown Token:", *grps)

            m = tokens.search(file, pos=matchend)
        
        return file


def main():

    preprocessed = preprocess("./fantacy.js")

    with io.open("./extension/fantacy.js", "w") as f:
        f.write(preprocessed)


if __name__ == "__main__":
    main()
