# Generate secrets

like the name is saying, this script is used to create secrets for the test environments.

It creates _weak_ auth keys, _weak_ certificates and _faked_ firebase credentials.
**So don't use this for production!**

## Usage

`docker build --build-arg AUTH_KEY_SIZE=1024 --build-arg CA_KEY_SIZE=1024 --build-arg SERVICE_KEY_SIZE=1024 --build-arg CA_VALIDITY_DAYS=36500 --build-arg SERVICE_VALIDITY_DAYS=36500 -o . .`
