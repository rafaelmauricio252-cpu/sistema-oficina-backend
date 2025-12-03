export async function up(pgm) {
    pgm.addColumns('ordem_servico', {
        data_agendamento: { type: 'date', notNull: false },
    });
}

export async function down(pgm) {
    pgm.dropColumns('ordem_servico', ['data_agendamento']);
}
