# Creating the First User

Professional users are managed by the role SysAdmin. To add the first SysAdmin user, you can use the following command while replacing the placeholders:

```bash
kubectl -n <your-namespace> exec -it deploy/authserver -- /add-sysadmin.sh --email <users-mail-address> --password <password>
```

> ℹ️ Please note, that the password needs to meet to the following password policy:
>
> - minimum length of 10 characters (unless configured differently)
> - maximum length of 80 characters
> - must contain at least one digit
> - must contain at least one special character
> - must contain at least one lower case character
> - must contain at least one upper case character
> - must not equal the username or the email
