import axios from 'axios';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Criar instância do axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requisições
api.interceptors.request.use(
  (config) => {
    // Aqui pode adicionar token de autenticação se necessário
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratamento de erros globais
    if (error.response) {
      // O servidor respondeu com um status de erro
      console.error('Erro na resposta:', error.response.data);

      if (error.response.status === 401) {
        // Não autorizado - redirecionar para login se necessário
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Erro na requisição:', error.request);
    } else {
      // Algo aconteceu ao configurar a requisição
      console.error('Erro:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
