# Prefixes for backend-mapping.ts

- Prefixes are created by with [pwgen](https://linux.die.net/man/1/pwgen). The following command creates 10 prefixes:

```
pwgen -A -B -0 4 10
```

- The [generate-prefixes-script](./generate-prefixes.sh) creates 10 different prefixes of length 4 in lower case using `pwgen`. The prefixes can be easily copy and pasted. The generated passwords are not ambiguous: Characters that could be confused by the user when printed, such as 'l' and '1', or '0' or 'O', are not used for the prefixes. The script can be run on linux machines or in dockerfiles by executing:

```
bash generate-prefixes.sh
```

- The [check-duplicates-script](./check-duplicates-backend-mapping.js) takes an array of objects with prefixes and checks for duplicates in the prefix attribute.
  The array from the backend-mapping must be copied into the dataArray in the script. Afterwards, the script can be run on machines with NodeJS installed by executing:

```
node check-duplicates-backend-mapping.js
```
