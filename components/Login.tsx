


import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useModal } from '../hooks/useModal';


const GraphicPanel = () => {
    return (
        <div 
            className="hidden md:flex md:w-1/2 bg-primary bg-cover bg-no-repeat bg-center"
            style={{ backgroundImage: "url('https://i.imgur.com/tvyDLox.png')" }}
        />
    );
};


const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');

  const { login, allEmployees } = useAuth();
  const modal = useModal();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = allEmployees.find(emp => emp.email.toLowerCase() === email.toLowerCase() && emp.cpf === cpf);

    if (user && user.status === 'inactive') {
        setError('Este usuário está inativo. Entre em contato com o RH.');
        return;
    }

    if (!login(email, cpf)) {
      setError('E-mail ou Senha inválidos. Tente novamente.');
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage('');
    const user = allEmployees.find(emp => emp.email.toLowerCase() === recoveryEmail.toLowerCase());
    if (user) {
        modal.alert({
            title: 'Instruções Enviadas!',
            message: `Para fins de demonstração, sua senha é o seu CPF: ${user.cpf}`,
            confirmVariant: 'info',
        });
        setRecoveryMessage('Se o e-mail estiver em nosso sistema, você receberá instruções para redefinir sua senha.');
    } else {
        setRecoveryMessage('Se o e-mail estiver em nosso sistema, você receberá instruções para redefinir sua senha.');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-white">
        <div className="flex w-full flex-col items-center justify-center p-8 md:w-1/2">
            <div className="w-full max-w-sm">
                {isForgotPassword ? (
                    <>
                        <div className="text-center">
                            <img src="https://i.imgur.com/ffuLjCn.png" alt="FériasPro Logo" className="mx-auto h-12 w-auto mb-4" />
                            <h2 className="mt-4 text-2xl font-bold text-blue-900">Recuperar Senha</h2>
                            <p className="mt-2 text-sm text-slate-600">Insira seu e-mail para receber as instruções.</p>
                        </div>
                        <form className="mt-8 space-y-6" onSubmit={handleRecoverySubmit}>
                            <div>
                                <input
                                    id="recovery-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="bg-white appearance-none rounded-full relative block w-full px-4 py-3 border border-slate-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info sm:text-sm"
                                    placeholder="E-mail profissional"
                                    value={recoveryEmail}
                                    onChange={(e) => setRecoveryEmail(e.target.value)}
                                />
                            </div>
                            {recoveryMessage && <p className="text-sm text-green-600 text-center">{recoveryMessage}</p>}
                            <div>
                                <button
                                    type="submit"
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition duration-150 ease-in-out"
                                >
                                    Enviar
                                </button>
                            </div>
                        </form>
                        <div className="text-sm text-center mt-4">
                            <button onClick={() => setIsForgotPassword(false)} className="font-medium text-primary hover:text-blue-600">
                                Voltar para o login
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-center">
                            <img src="https://i.imgur.com/ffuLjCn.png" alt="FériasPro Logo" className="mx-auto h-12 w-auto mb-4" />
                            <h2 className="text-3xl font-bold text-blue-900">Bem-vindo!</h2>
                            <p className="mt-2 text-sm text-slate-600">Planeje suas férias com facilidade.</p>
                        </div>
                        <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="bg-white appearance-none rounded-full relative block w-full px-4 py-3 border border-slate-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info sm:text-sm"
                                        placeholder="E-mail profissional"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <input
                                        id="cpf"
                                        name="cpf"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="bg-white appearance-none rounded-full relative block w-full px-4 py-3 border border-slate-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-info/50 focus:border-info sm:text-sm"
                                        placeholder="Senha"
                                        value={cpf}
                                        onChange={(e) => setCpf(e.target.value)}
                                    />
                                </div>
                            </div>
                      
                            <div className="flex items-center justify-between">
                                <div></div> {/* Placeholder for alignment */}
                                <div className="text-sm">
                                    <button
                                        type="button"
                                        onClick={() => setIsForgotPassword(true)}
                                        className="font-medium text-primary hover:text-blue-600"
                                    >
                                        Esqueci minha senha
                                    </button>
                                </div>
                            </div>
    
                            {error && <p className="text-sm text-danger text-center">{error}</p>}
                      
                            <div>
                                <button
                                    type="submit"
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition duration-150 ease-in-out"
                                >
                                    Entrar
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
        <GraphicPanel />
    </div>
  );
};

export default Login;