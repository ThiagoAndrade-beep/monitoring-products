export function validatorPassword(password) {
    const minLength = password.length < 6
    const passwordRegex = /^(?=.*[@$!%*?&#])/;
    const resultPassword = passwordRegex.test(password)

    return {
        minLength,
        resultPassword
    }
}