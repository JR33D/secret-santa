module.exports = {
	compare: jest.fn(),
	hash: jest.fn().mockResolvedValue('hashed_password'),
};
