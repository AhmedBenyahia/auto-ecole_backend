const rewire = require('rewire');
const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const usernameGenerator = require('username-generator');
const authenticationRewire = rewire('../../../routes/authentication');
const generateAuthToken = authenticationRewire.__get__('generateAuthToken');

describe('authentication middleware', () => {
    it(' should return a valid jwt token', async () => {
        const user = {
            _id: new mongoose.Types.ObjectId().toString(),
            username: usernameGenerator.generateUsername('-', 8),
            role: 'admin',
            agency: new mongoose.Types.ObjectId().toString(),
        };
        const token = generateAuthToken(user);
        expect(await jwt.verify(token, config.get('jwtPrivateKey')))
            .toMatchObject(user);
    });
});

