# DA Soluções Digitais

Site estático com apresentação, solicitação de orçamento e mentoria individual.

Site: https://davizeiras.github.io/-da-solucoes-digitais/atendimento/

## Páginas

- `index.html`: página inicial.
- `orcamento/index.html`: orçamento em quatro etapas.
- `mentoria/index.html`: mentoria em seis etapas.
- `assets/flow-core.mjs`: perguntas, validação e mensagem do WhatsApp.
- `assets/form.mjs`: navegação e seletores.
- `assets/style.css` e `assets/forms.css`: aparência responsiva.

As respostas ficam na memória da aba. O cliente confere a mensagem e confirma o envio no WhatsApp para **+55 99 99651-0214**. Não há banco de dados nem envio automático.

## Visualização local

Na pasta do projeto, execute:

```sh
python -m http.server 8000
```

Abra `http://localhost:8000/`. Não é necessário instalar dependências ou fazer build.

## Publicação

Este site fica em `atendimento/` no repositório `davizeiras/-da-solucoes-digitais`. O GitHub Pages publica a branch `main` e a pasta `/ (root)`. O arquivo `.nojekyll` permite servir diretamente os arquivos estáticos. Os caminhos relativos funcionam em subpastas e em um domínio próprio.
