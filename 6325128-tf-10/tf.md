Nome: Felipe Damasceno
RA: 6325128
GitHub: https://github.com/FelipeDesda

Armadilha do dispatch:

## A Armadilha do rabbit.close()

### O Problema

No arquivo `src/utils/job.js`, a função `dispatch` do `createJob` era implementada da seguinte forma:

```javascript
async function dispatch(queue, payload = {}, options = {}) {
    if (!queue) {
        throw new Error('dispatch requer o parâmetro queue.')
    }

    if (!name || typeof name !== 'string') {
        throw new Error('dispatch requer o nome do job como string.')
    }

    await rabbit.connect()

    try {
        return await rabbit.publish(queue, { job: name, payload }, options)
    } finally {
        await rabbit.close()  // ❌ PROBLEMA: Fecha a conexão sempre!
    }
}
```

**Por que isso é um problema?**

Quando o servidor WebSocket (`_websocket.js`) está rodando, ele mantém uma conexão aberta com o RabbitMQ para:
1. Assinar exchanges (`notifications` e `results`)
2. Receber eventos e entregá-los aos clientes conectados via Socket.IO

Quando um Event (ex.: `ChatImageEvent`) chama `ProcessChatImageJob.dispatch('images', payload)` dentro do contexto do WebSocket, o `dispatch`:
1. Usa a conexão do RabbitMQ que **já está aberta** pelo WebSocket
2. Publica a mensagem na fila `images`
3. No `finally`, chama `rabbit.close()`
4. **Fecha a conexão que o WebSocket está usando** ❌

**Resultado:** O WebSocket perde a conexão com o RabbitMQ, para de receber eventos do exchange, e todos os clientes perdem a comunicação em tempo real.

### A Solução

A correção foi implementada verificando se a conexão já estava aberta **antes** de conectar, e só fechando se a conexão foi aberta pelo próprio `dispatch`:

```javascript
async function dispatch(queue, payload = {}, options = {}) {
    if (!queue) {
        throw new Error('dispatch requer o parâmetro queue.')
    }

    if (!name || typeof name !== 'string') {
        throw new Error('dispatch requer o nome do job como string.')
    }

    // ✅ Verifica se a conexão já estava aberta ANTES de conectar
    const wasConnected = rabbit.isConnected()
    
    await rabbit.connect()

    try {
        return await rabbit.publish(queue, { job: name, payload }, options)
    } finally {
        // ✅ Só fecha a conexão se ela foi aberta por este dispatch
        if (!wasConnected) {
            await rabbit.close()
        }
    }
}
```

**Como funciona:**

1. **Cenário 1 - WebSocket chamando dispatch:**
   - `wasConnected = true` (WebSocket já conectou antes)
   - `rabbit.connect()` não faz nada (já está conectado)
   - Publica a mensagem
   - `if (!wasConnected)` é `false` → **não fecha a conexão** ✅
   - WebSocket continua funcionando normalmente

2. **Cenário 2 - Script standalone chamando dispatch:**
   - `wasConnected = false` (nenhuma conexão ativa)
   - `rabbit.connect()` abre nova conexão
   - Publica a mensagem
   - `if (!wasConnected)` é `true` → **fecha a conexão** ✅
   - Faz cleanup correto

### Prova de que a Solução Funciona

**Teste de resiliência:**

1. Suba todos os containers:
   ```bash
   docker compose up -d
   ```

2. Pare o worker de imagens:
   ```bash
   docker compose stop nodeworker-images-container
   ```

3. No navegador, teste o chat:
   - ✅ Mensagens de texto funcionam normalmente
   - ✅ Evento "digitando..." funciona normalmente
   - ✅ Trocar de sala funciona normalmente
   - ✅ Enviar imagem: a imagem é enfileirada mas não aparece ainda

4. Verifique a fila no RabbitMQ:
   - Acesse: http://localhost:15672
   - Vá em Queues → `images`
   - Você verá 1 mensagem na fila

5. Inicie o worker de imagens:
   ```bash
   docker compose start nodeworker-images-container
   ```

6. Observe os logs:
   ```bash
   docker compose logs -f nodeworker-images-container
   ```
   
   Você verá:
   ```
   Processando imagem de [nome] na sala [sala]: [arquivo]
   Imagem processada: [arquivo]
   ```

7. No navegador, após ~3 segundos, a imagem aparece automaticamente no feed.

**O que isso prova?**

- O chat de texto continuou funcionando mesmo com o worker parado
- O WebSocket não perdeu a conexão ao chamar `dispatch`
- A imagem ficou na fila (não foi perdida)
- Quando o worker voltou, processou a imagem e o resultado chegou aos clientes

Isso demonstra que:
1. A conexão do WebSocket é preservada ✅
2. O sistema é resiliente (chat funciona independente do worker) ✅
3. As filas do RabbitMQ desacoplam os componentes ✅

### Por Que Isso É Importante?

Esta armadilha ilustra um padrão comum em sistemas distribuídos:

**Compartilhamento de recursos:**
- O singleton `rabbit` (conexão compartilhada) pode ser usado por múltiplos componentes
- Cada componente precisa respeitar o ciclo de vida da conexão
- Fechar uma conexão compartilhada afeta todos que a usam

**Solução:**
- Verificar o estado **antes** de modificá-lo
- Só fazer cleanup do que você mesmo criou
- Princípio: "Quem abre, fecha"

### Alternativas Consideradas

**Alternativa 1: Pool de conexões**
- Manter múltiplas conexões independentes
- ❌ Mais complexo, consome mais recursos
- ✅ Isolamento total entre componentes

**Alternativa 2: Não fechar no dispatch**
- Deixar a conexão sempre aberta
- ❌ Vazamento de recursos em scripts standalone
- ❌ Scripts que usam dispatch ficariam com conexões abertas

**Alternativa 3: Passar flag para dispatch**
- `dispatch('images', payload, { keepAlive: true })`
- ❌ Adiciona complexidade à API
- ❌ Fácil esquecer de passar a flag

**Solução escolhida:**
- Verificar `isConnected()` antes
- ✅ Simples e transparente
- ✅ Funciona em todos os cenários
- ✅ Não muda a API pública

### Impacto no Código

**Antes da correção:**
- ❌ WebSocket parava de funcionar ao enviar imagem
- ❌ Clientes perdiam conexão
- ❌ Era necessário reiniciar o servidor

**Depois da correção:**
- ✅ WebSocket mantém conexão estável
- ✅ Imagens são enfileiradas corretamente
- ✅ Sistema continua funcionando normalmente

### Lições Aprendidas

1. **Recursos compartilhados precisam de cuidado especial**
   - Conexões, arquivos, locks, etc.
   - Sempre verificar estado antes de modificar

2. **Cleanup deve ser proporcional à criação**
   - Se você abriu, você fecha
   - Se já estava aberto, deixe aberto

3. **Testes de resiliência são essenciais**
   - Testar com componentes parados
   - Verificar se o sistema continua funcionando
   - Observar logs e métricas

4. **Arquitetura assíncrona com filas tem vantagens**
   - Desacoplamento entre componentes
   - Workers podem cair e voltar
   - Mensagens não são perdidas
