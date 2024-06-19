class User {
  constructor({ id, name, username, password, email, address, avatar }) {
    this.id = id;
    this.name = name;
    this.username = username;
    this.password = password;
    this.email = email;
    this.address = address;
    this.avatar = avatar;
  }
}

export default User;

// const userData = new User({
//   id: 1,
//   name: "John Doe",
//   username: "johndoe123",
//   password: "securepassword123",
//   email: "johndoe@example.com",
//   address: {
//     street: "123 Main St",
//     city: "Anytown",
//     state: "Anystate",
//     zip: "12345",
//     country: "USA"
//   },
//   avatar: "https://example.com/avatar.jpg"
// });

