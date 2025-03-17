export async function fetchToken() {
    try {
        console.log('Отправка запроса на /api/v1/security/login с данными:', {
            username: 'admin',
            password: 'admin',
            provider: 'db',
            refresh: true
        });
        const response = await fetch('http://localhost:8089/api/v1/security/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin',
                provider: 'db',
                refresh: true
            })
        });

        console.log('Ответ сервера:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Детали ошибки от сервера:', errorText);
            throw new Error(`Ошибка получения токена: ${response.status} - ${response.statusText}. Детали: ${errorText}`);
        }

        const data = await response.json();
        console.log('Данные ответа от сервера:', data);

        if (!data.access_token) {
            throw new Error(`Токен не найден в ответе сервера. Полученные данные: ${JSON.stringify(data)}`);
        }

        const token = data.access_token;
        console.log('Новый токен получен:', token);
        localStorage.setItem('superset_token', token);
        return token;
    } catch (error) {
        console.error('Ошибка при получении токена:', error.message);
        alert(`Не удалось получить токен: ${error.message}`);
        return null;
    }
}