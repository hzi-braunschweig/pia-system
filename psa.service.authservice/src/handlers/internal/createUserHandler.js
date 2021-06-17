const pgHelper = require('../../services/postgresqlHelper.js');
const pwHashesHelper = require('../../helpers/pwHashesHelper.js');
const Boom = require('@hapi/boom');

class CreateUserHandler {
  static async createUser(request) {
    const payload = request.payload;

    try {
      const user = {
        username: payload.username,
        role: payload.role,
        initial_password_validity_date: payload.initial_password_validity_date,
        pw_change_needed: payload.pw_change_needed,
        account_status: payload.account_status,
      };
      if (payload.password) {
        const { passwordHash, salt } =
          pwHashesHelper.createHashedPasswordWithSaltAndPepper(
            payload.password
          );

        user.password = passwordHash;
        user.salt = salt;
      } else {
        // for ids probands
        user.password = '';
      }

      return await pgHelper.createUser(user);
    } catch (error) {
      if (error.code === '23505') {
        return Boom.conflict('User already exists');
      }
      console.error(error);
      return Boom.internal('Failed to create user');
    }
  }
}

module.exports = CreateUserHandler;
