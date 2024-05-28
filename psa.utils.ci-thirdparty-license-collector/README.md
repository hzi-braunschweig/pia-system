# Updating THIRD_PARTY_LICENSES

To update the third party licenses run

```bash
docker build --target raw -f psa.utils.ci-thirdparty-license-collector/Dockerfile -o . .
```

from the project root.
