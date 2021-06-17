# Secrets dockerfile

This dockerfile is used to add secrets to the containers.
**It is not ment to be used for production.**
It is required because services in gitlab-ci are unable to mount file.
So we use this generic dockerfile to add the secrets.
To keep this dockerfile generic we copy _ALL_ secrets to _ALL_ images on _ALL_ possible locations.
This is good for testing but pretty bad for prodcution.
So again: **don't use this for production**.
