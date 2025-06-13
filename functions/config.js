module.exports = {
  // Your site configuration
  SITE_URL: 'https://heic2png.store',
  SITEMAP_URL: 'https://heic2png.store/sitemap.xml',

  // Service account configuration
  SERVICE_ACCOUNT: {
    type: "service_account",
    project_id: "leafy-container-462712-b5",
    private_key_id: "your_private_key_id",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCldl3bNUa/r4gM\n9TTNPx79ztASJvoly3wQYFWiILU0PYQyrC68RYBdjwsFPXABMXVo/n9AKJQ+++8j\n5814OUo61TmA6z+cRKdMdKcxocaDkF51qfGbYPpWfCVxUOlKKIoJgicvXjrFVCYh\nCG2J0hHs9PPomD3UgjkyACRpW0RMmaUoezXpwQ2FaTIpnEgqchHO8uCh/3n3KkTl\ntSsjUzBJnjiI358tYBbveZ5Fsu/Z+gh5XFIg/l09UgDQ8dgIPifXFrXdFwF4jW/z\n7MmL5wz3WjTQrZaWlvdZVQXq8GFoYz7MazzbFoBptWIXhXF3O2sPA46TEYkg51qg\nH9GGWIOlAgMBAAECggEAAs1sbYgLeLeqYD3O9SL6jWXxVD1gwz8dDNH04VgYeZgJ\nIyqTaBDtSahgkWgm+34w9ORKl3WYfTCbLkqAymZ+AV0XKj3Rx/3Jr5vSMR8CU7wg\nPXHxa6ZK1ygnIjIyoVTqcZrIux6ndCwmsSyJXmo2b4L+lpPtiCnkehpSg45OK9Xv\nYC/3CNMNbiIqee3erTGN2lef15Yu/b1mIKwkRWX9A/0NF3/0q1XT7UdsxKLeoV9R\nCKQpsOGIUkQkNG8dBEumKzZwFdDD2N7LDWlkoP/wnR6wrooy4i9kjajZP9b9sYZZ\nuCd9dI0lk6DE/479NGrHfgZm6Af42Lzq3MvovjUUCQKBgQDajeNUydP/maKWNWIG\nvcRc8DBcP0jjSF9ZdAqh/rVzGq8Xtzt6LXQ4kLjTVudpBTf3uE2zntx1MC8FeVwM\nutNXML5mz3pXsoxFOJRdNhRN0UDJLRqOTbqxEp7qK4/YyOtKw3ziV4zRtxH1VC05\nlXLZiAkriEKoTX9bCHoq36TbbwKBgQDBz8pWGl7tW/SYPfMU5e/jBSpCJVwMUnNP\nhXAy/kWK6USsdDmN3piM7tDtDVJiVexoZ0vj6wSR14YLWoKMPvbubtqL4ZiW8iNR\nbjZHzhTL0dlZ082+2wQ74sFuJ5ES4eFLjuERKeoOdiIglEyCvkUhQVodSriJBbz2\nbuDMcp7YKwKBgHof4REG+qSQKA8BY3Za4fgA6zUQ09zVGxq0QiDFYIUiOwboh568\n+X2GORE3NXY0yVJuNVUShyQguZW4e9xNJT1KaoqukzGf/svLUvRG/M+DB02jG3y7\nKIA75Hr7vpSnqPsNA6LCw1iIkMtirybHQPcXEfC2YnEDZQ/sS7/bWpaXAoGBAJmw\nr2EsNE7BdusrZRITbPF37RTbD21uDKboyBqH7JnFdYHUALfx5sMLtn3k7ImyXXBF\nSbcJbWxBnrhuI8wXOjXFjmUSlrBMf5lZbo3ubCtc06EaBrPsdiUPIhi6I573pHMI\ncI3t0P96yoFPWITtYWCHtHA6CrAN7tT1BCrcUf5VAoGAJEBqowcJV3qTj/6R+oFd\nku0RX3QaoeYPrl4ydP29ClSjSBKnsjYMMLwq4Z4g+QPCyLV2+v8OJ/NaqUf84Tdc\nF8GZVU5gEo7Oad0+uFdaqiGVi4YUBmFbwZVbiDZ4JlhHyYjPqcQpRdhQKm+u5dD8\n1fG8IqV4VgYyVi8A5gCFOoE=\n-----END PRIVATE KEY-----\n",
    client_email: "heic2png-store@leafy-container-462712-b5.iam.gserviceaccount.com",
    client_id: "115175737657462824542",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/heic2png-store%40leafy-container-462712-b5.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  },

  // API settings
  DAILY_QUOTA: 200,
  BATCH_SIZE: 50,

  // Indexing API settings
  SCOPES: ['https://www.googleapis.com/auth/indexing'],
  API_ENDPOINT: 'https://indexing.googleapis.com/v3/urlNotifications:publish'
};
