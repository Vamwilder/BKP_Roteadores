
# 📦 Projeto: Backup Automatizado de Mikrotik via SSH + FTP

## 🎯 Objetivo

Automatizar a conexão com diversos roteadores **MikroTik** para:

1. Obter o nome do roteador;
2. Gerar um backup de configuração via comando `export`;
3. Baixar o arquivo `.rsc` via FTP;
4. Organizar os arquivos localmente por IP em pastas individuais.

---

## ⚙️ Tecnologias Utilizadas

- 📡 **SSH** (`ssh2`) para execução remota de comandos.
- 📥 **FTP** (`basic-ftp`) para download dos arquivos de backup.
- 🧰 **Node.js** para automação do processo.

---

## 🗂️ Organização do Código

### 📋 Lista de Roteadores

O script começa com uma lista de roteadores contendo IP, usuário e senha:

```js
const mikrotiks = [
  { host: '10.1.101.1', username: 'BKP', password: '...' },
  ...
];
```

---

### 🔁 Processo por Roteador

Para **cada roteador**, o script executa:

1. **Conexão via SSH**
2. **Execução do comando `/system identity print`** para obter o nome do roteador.
3. **Geração do arquivo de backup** com:
   ```
   export file=backup_NOMEDOROTEADOR_TIMESTAMP
   ```
4. **Espera 10 segundos** para garantir que o arquivo foi salvo.
5. **Download via FTP** do arquivo `.rsc` para a pasta local:  
   `./backups/<IP_DO_ROTEADOR>/backup_<nome>_<timestamp>.rsc`

---

## 🧠 Funções Importantes

### `getTimestamp()`
Gera uma string com data/hora formatada para usar no nome do arquivo.

---

### `processRouter(router)`
Conecta via SSH no roteador, obtém o nome e inicia a exportação do backup.

---

### `downloadBackup(router, backupFile)`
Conecta via FTP, cria a pasta local e baixa o arquivo gerado.

---

### `startBackup()`
Percorre toda a lista de roteadores e processa um por um.

---

## 📁 Estrutura Final dos Arquivos

```
backups/
├── 10.1.1.1/
│   └── backup_router1_20250707_093000.rsc
├── 10.1.2.1/
│   └── backup_router2_20250707_093010.rsc
...
```

---

## ✅ Resultados Esperados

- Todos os backups organizados por IP.
- Nome dos arquivos com nome do roteador + timestamp.
- Processo automatizado sem necessidade de interação manual.

---

## 👤 Criado por Maik de Moura Lechinovski