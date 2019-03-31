import io
import re

def main():
    sub = re.compile(r"`.*`", re.S)
    with io.open("./fantacy.js", "r") as f:
        fantacy = f.read()

    with io.open("./injected.js", "r") as f:
        injection = f.read()

    with io.open("./fantacy.js", "w") as f:
        f.write(sub.sub("`\n" + injection + "\n`", fantacy))


if __name__ == "__main__":
    main()
