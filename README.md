# thesisAPI

## API Responses:

### Users

```JSON
{
  "user": {
    "email": "",
    "token": "",
    "username": "",
    "role": "",
  }
}
```


## API Endpoints:

### Authentication(Login):

`POST /auth`

Request body:
```JSON
{
  "credentials": {
    "email": "",
    "password": ""
  }
}
```

Response: [User](#users)


### Customer Registration:

`POST /register/customer`

Request body:
```JSON
{
  "user": {
    "email": "",
    "username": "",
    "password": "",
    "firstName": "",
    "lastName": "",
    "country": "",
    "town": "",
    "address": {
      "street": "",
      "number": "",
    }

  }
}
```

Response: [User](#users)


### Company(Manager) Registration:

`POST /register/manager`

Request body:
```JSON
{
  "user": {
    "email": "",
    "username": "",
    "password": "",
    "firstName": "",
    "lastName": "",
    "company": {
      "VAT": "",
      "name": "",
      "country": "",
      "town": "",
      "address": {
        "street": "",
        "number": "",
      }
    }
  }
}
```

Response: [User](#users)

