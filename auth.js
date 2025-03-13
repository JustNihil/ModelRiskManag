// Функции для работы с авторизацией
export async function fetchToken() {
    try {
        const response = await fetch('http://localhost:8088/api/v1/security/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin',
                provider: 'db'
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка получения токена: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        const token = data.access_token;
        if (!token) throw new Error('Токен не найден в ответе сервера');
        console.log('Новый токен получен:', token);
        localStorage.setItem('superset_token', token);
        return token;
    } catch (error) {
        console.error('Ошибка при получении токена:', error);
        return null;
    }
}