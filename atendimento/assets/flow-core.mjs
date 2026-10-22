export const DESTINATION = '5599996510214';
export const sharedFields = [
  { id:'nome', label:'Como você se chama?', summary:'Nome', type:'text', autocomplete:'name', placeholder:'Digite seu nome', description:'É assim que vou chamar você na nossa conversa.', maxLength:100 },
  { id:'whatsapp', label:'Qual é seu WhatsApp?', summary:'WhatsApp', type:'tel', autocomplete:'tel', placeholder:'(99) 99651-0214', description:'Informe seu número com DDD.', help:'Está fora do Brasil? Comece com + e o código do país. Ex.: +351 912 345 678.', maxLength:30 }
];
export const flows = {
  orcamento: {
    kicker:'SOLICITAÇÃO DE ORÇAMENTO', title:'Vamos tirar sua ideia do papel.', subtitle:'Me conta o que você tem em mente. A próxima conversa já começa com o seu projeto.',
    intro:'Olá, DA Soluções Digitais! Vim pelo site e gostaria de solicitar um orçamento.', ending:'Podemos conversar sobre meu projeto?',
    fields:[...sharedFields,
      {id:'servico',label:'O que você precisa?',summary:'O que preciso',type:'select',description:'Escolha a solução que você está buscando.',options:['Aplicativo','Sistema','Site ou loja virtual','Anúncio online','Outros']},
      {id:'faturamento',label:'Faturamento atual',summary:'Faturamento atual',type:'select',description:'Essa informação nos ajuda a entender o momento do seu negócio.',options:['Abaixo de R$10.000','Entre R$10.000 e R$50.000','Acima de R$50.000','Acima de R$100.000','Não tenho faturamento']}
    ]
  },
  mentoria: {
    kicker:'MENTORIA INDIVIDUAL', title:'Seu próximo passo, com direção.', subtitle:'Quero entender onde você está e aonde quer chegar. Vamos começar por você.',
    intro:'Olá, DA Soluções Digitais! Vim pelo site e tenho interesse na mentoria individual.', ending:'Gostaria de saber mais sobre a mentoria!',
    fields:[...sharedFields,
      {id:'experiencia',label:'Qual é sua experiência hoje?',summary:'Experiência',type:'select',description:'Escolha a opção que descreve seu momento.',options:['Estou começando do zero','Já estudo, mas ainda não trabalho na área','Já faço projetos ou atendo clientes','Já trabalho na área e quero evoluir']},
      {id:'objetivo',label:'Qual é seu principal objetivo?',summary:'Principal objetivo',type:'select',description:'O que você quer alcançar com a mentoria?',options:['Aprender programação na prática','Criar meu primeiro projeto','Conseguir uma oportunidade de trabalho','Começar a atender clientes','Melhorar meus serviços e crescer','Outro objetivo']},
      {id:'disponibilidade',label:'Quanto tempo pode dedicar?',summary:'Disponibilidade semanal',type:'select',description:'Pense no tempo que você tem disponível por semana.',options:['Até 2 horas','Mais de 2 até 5 horas','Mais de 5 até 10 horas','Mais de 10 horas','Ainda preciso organizar minha rotina']},
      {id:'desafio',label:'Qual é seu maior desafio hoje?',summary:'Maior desafio',type:'textarea',description:'Conte o que está dificultando seu próximo passo.',placeholder:'Como você espera que a mentoria ajude?',maxLength:1000,help:'Pode escrever do seu jeito. Até 1.000 caracteres.'}
    ]
  }
};

export function validate(field, raw) {
  const value = String(raw ?? '').trim();
  if (!value) return field.type === 'select' ? 'Selecione uma opção para continuar.' : 'Preencha este campo para continuar.';
  if(field.maxLength && value.length > field.maxLength) return `Use até ${field.maxLength} caracteres.`;
  if(field.type === 'select' && !field.options.includes(value)) return 'Selecione uma das opções disponíveis.';
  if(field.type === 'tel') {
    if(!/^\+?[\d\s().-]+$/.test(value)) return 'Informe um telefone válido, com DDD ou código do país.';
    const digits = value.replace(/\D/g,'');
    if(/^(\d)\1+$/.test(digits)) return 'Confira o número do seu WhatsApp.';
    if(value.startsWith('+')) {
      if(!/^[1-9]\d{7,14}$/.test(digits)) return 'Inclua +, o código do país e um número válido.';
    } else if(!/^[1-9]{2}(?:[2-9]\d{7}|9\d{8})$/.test(digits)) {
      return 'Informe o DDD e o telefone. Ex.: (99) 99651-0214.';
    }
  }
  return '';
}

export function buildMessage(flow, values) {
  return [flow.intro,'',...flow.fields.map(field => `${field.summary}: ${String(values[field.id] ?? '').trim()}`),'',flow.ending].join('\n');
}
export function buildWhatsAppUrl(flow, values) {
  return `https://wa.me/${DESTINATION}?text=${encodeURIComponent(buildMessage(flow, values))}`;
}
