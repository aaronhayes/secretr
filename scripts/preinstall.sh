#
# Preinstall Script
#   - Checks relevant packages are insatlled
#   - Installs/Downloads where possible
# 
# --------
# @package: @secretr
# @author: Aaron Hayes (aaron.hayes92@gmail.com)
# @since: 16-December-2018
# 
command -v docker >/dev/null 2>&1 || {
    echo "Could not locate docker; exiting...">&2;
    exit 1
}

command -v docker-compose >/dev/null 2>&1 || {
    echo "Could not locate docker-compose; exiting...">&2;
    exit 1
}

command -v serverless >/dev/null 2>&1 || {
    echo "Could not locate serverless; installing...">&2;
    npm i -g serverless
}

echo "Downloading docker containers"
docker pull localstack/localstack