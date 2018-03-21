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
  "data": {
    "email": "",
    "username": "",
    "password": "",
    "first_name": "",
    "last_name": "",
    "country": "",
    "city": "",
    "street": "",
    "number": "",
  }
}
```

Response: [User](#users)


### Company(Manager) Registration:

`POST /register/manager`

Request body:
```JSON
{
  "data": {
    "email": "",
    "username": "",
    "password": "",
    "first_name": "",
    "last_name": "",
    "company_name": "",
    "country": "",
    "city": "",
    "street": "",
    "number": "",
  }
}
```

Response: [User](#users)

