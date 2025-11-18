import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import type { OrdemServico as OrdemServicoType, OSFormData, Cliente, Veiculo, Mecanico, Servico, Peca } from '../../types';
import ordemServicoService from '../../services/ordemServicoService';
import clienteService from '../../services/clienteService';
import veiculoService from '../../services/veiculoService';
import mecanicoService from '../../services/mecanicoService';
import servicoService from '../../services/servicoService';
import pecaService from '../../services/pecaService';
import { useNavigate } from 'react-router-dom';

export default function OrdemServico() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<OrdemServicoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOS, setSelectedOS] = useState<OrdemServicoType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  // States para criação de OS
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [formData, setFormData] = useState<Partial<OSFormData>>({
    status: 'Aguardando',
    data_abertura: new Date().toISOString().split('T')[0],
    desconto: 0,
    servicos: [],
    pecas: [],
  });

  useEffect(() => {
    loadOrdens();
    loadFormData();
  }, []);

  const loadOrdens = async () => {
    try {
      setLoading(true);
      const data = await ordemServicoService.getAll();
      setOrdens(data);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao carregar ordens de serviço');
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [clientesData, veiculosData, mecanicosData, servicosData, pecasData] = await Promise.all([
        clienteService.getAll(),
        veiculoService.getAll(),
        mecanicoService.getAll(),
        servicoService.getAll(),
        pecaService.getAll(),
      ]);
      setClientes(clientesData);
      setVeiculos(veiculosData);
      setMecanicos(mecanicosData);
      setServicos(servicosData);
      setPecas(pecasData);
    } catch (err: any) {
      console.error('Erro ao carregar dados do formulário:', err);
    }
  };

  const handleViewDetails = (os: OrdemServicoType) => {
    setSelectedOS(os);
    setDialogOpen(true);
  };

  const handleUpdateStatus = (os: OrdemServicoType) => {
    setSelectedOS(os);
    setNewStatus(os.status);
    setStatusDialogOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedOS) return;

    try {
      await ordemServicoService.update(selectedOS.id, { status: newStatus });
      setStatusDialogOpen(false);
      loadOrdens();
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao atualizar status');
    }
  };

  const handleOpenCreateDialog = () => {
    setFormData({
      status: 'Aguardando',
      data_abertura: new Date().toISOString().split('T')[0],
      desconto: 0,
      servicos: [],
      pecas: [],
    });
    setCreateDialogOpen(true);
  };

  const handleAddServico = () => {
    setFormData({
      ...formData,
      servicos: [
        ...(formData.servicos || []),
        { servico_id: 0, quantidade: 1, preco_unitario: 0 },
      ],
    });
  };

  const handleRemoveServico = (index: number) => {
    const newServicos = [...(formData.servicos || [])];
    newServicos.splice(index, 1);
    setFormData({ ...formData, servicos: newServicos });
  };

  const handleUpdateServico = (index: number, field: string, value: any) => {
    const newServicos = [...(formData.servicos || [])];
    newServicos[index] = { ...newServicos[index], [field]: value };
    setFormData({ ...formData, servicos: newServicos });
  };
  const handleAddPeca = () => {
    setFormData({
      ...formData,
      pecas: [
        ...(formData.pecas || []),
        { peca_id: 0, quantidade: 1, preco_unitario: 0 },
      ],
    });
  };

  const handleRemovePeca = (index: number) => {
    const newPecas = [...(formData.pecas || [])];
    newPecas.splice(index, 1);
    setFormData({ ...formData, pecas: newPecas });
  };

  const handleUpdatePeca = (index: number, field: string, value: any) => {
    const newPecas = [...(formData.pecas || [])];
    newPecas[index] = { ...newPecas[index], [field]: value };
    setFormData({ ...formData, pecas: newPecas });
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  const handleSubmitCreate = async () => {
    console.log('=== INICIANDO CRIAÇÃO DE OS ===');
    console.log('FormData completo:', formData);

    try {
      console.log('Cliente ID:', formData.cliente_id);
      console.log('Veículo ID:', formData.veiculo_id);
      console.log('Mecânico ID:', formData.mecanico_id);

      if (!formData.cliente_id || !formData.veiculo_id || !formData.mecanico_id) {
        console.log('ERRO: Campos obrigatórios faltando');
        setError('Cliente, Veículo e Mecânico são obrigatórios');
        return;
      }

      // Filtrar serviços e peças válidos (com ID > 0)
      const servicosValidos = (formData.servicos || []).filter(s => s.servico_id > 0);
      const pecasValidas = (formData.pecas || []).filter(p => p.peca_id > 0);

      console.log('Serviços válidos:', servicosValidos);
      console.log('Peças válidas:', pecasValidas);

      // Validar se tem pelo menos 1 serviço ou 1 peça
      if (servicosValidos.length === 0 && pecasValidas.length === 0) {
        console.log('ERRO: Nenhum serviço ou peça válido');
        setError('Adicione pelo menos 1 serviço ou 1 peça à ordem de serviço');
        return;
      }

      const dadosEnvio = {
        ...formData,
        servicos: servicosValidos.length > 0 ? servicosValidos : undefined,
        pecas: pecasValidas.length > 0 ? pecasValidas : undefined,
      };

      console.log('Dados a enviar para o backend:', dadosEnvio);

      await ordemServicoService.create(dadosEnvio as OSFormData);
      console.log('OS criada com sucesso!');
      setCreateDialogOpen(false);
      loadOrdens();
    } catch (err: any) {
      console.error('ERRO ao criar OS:', err);
      setError(err.response?.data?.erro || err.message || 'Erro ao criar ordem de serviço');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aguardando':
        return 'warning';
      case 'Em Andamento':
        return 'info';
      case 'Concluído':
        return 'success';
      case 'Pago':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Ordens de Serviço</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Nova OS
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>OS #</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Veículo</TableCell>
              <TableCell>Mecânico</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Valor Total</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ordens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Nenhuma ordem de serviço cadastrada
                </TableCell>
              </TableRow>
            ) : (
              ordens.map((os) => (
                <TableRow key={os.id}>
                  <TableCell>#{os.id}</TableCell>
                  <TableCell>{formatDate(os.data_abertura)}</TableCell>
                  <TableCell>{os.cliente?.nome || 'N/A'}</TableCell>
                  <TableCell>
                    {os.veiculo ? `${os.veiculo.marca} ${os.veiculo.modelo} - ${os.veiculo.placa}` : 'N/A'}
                  </TableCell>
                  <TableCell>{os.mecanico?.nome || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={os.status}
                      color={getStatusColor(os.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(os.valor_total)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(os)}
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleUpdateStatus(os)}
                      color="secondary"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Detalhes da OS */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalhes da Ordem de Serviço #{selectedOS?.id}</DialogTitle>
        <DialogContent>
          {selectedOS && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1">{selectedOS.cliente?.nome}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Veículo
                  </Typography>
                  <Typography variant="body1">
                    {selectedOS.veiculo
                      ? `${selectedOS.veiculo.marca} ${selectedOS.veiculo.modelo} - ${selectedOS.veiculo.placa}`
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Mecânico
                  </Typography>
                  <Typography variant="body1">{selectedOS.mecanico?.nome}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip label={selectedOS.status} color={getStatusColor(selectedOS.status)} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Data de Abertura
                  </Typography>
                  <Typography variant="body1">{formatDate(selectedOS.data_abertura)}</Typography>
                </Grid>
                {selectedOS.data_conclusao && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Data de Conclusão
                    </Typography>
                    <Typography variant="body1">{formatDate(selectedOS.data_conclusao)}</Typography>
                  </Grid>
                )}
                {selectedOS.descricao_problema && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Descrição do Problema
                    </Typography>
                    <Typography variant="body1">{selectedOS.descricao_problema}</Typography>
                  </Grid>
                )}
                {selectedOS.servicos && selectedOS.servicos.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Serviços
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Serviço</TableCell>
                            <TableCell align="right">Quantidade</TableCell>
                            <TableCell align="right">Preço Unit.</TableCell>
                            <TableCell align="right">Subtotal</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedOS.servicos.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell>{s.servico?.nome}</TableCell>
                              <TableCell align="right">{s.quantidade}</TableCell>
                              <TableCell align="right">{formatCurrency(s.preco_servico)}</TableCell>
                              <TableCell align="right">
                                {formatCurrency(s.preco_servico * s.quantidade)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
                {selectedOS.pecas && selectedOS.pecas.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Peças
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Peça</TableCell>
                            <TableCell align="right">Quantidade</TableCell>
                            <TableCell align="right">Preço Unit.</TableCell>
                            <TableCell align="right">Subtotal</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedOS.pecas.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell>{p.peca?.nome}</TableCell>
                              <TableCell align="right">{p.quantidade}</TableCell>
                              <TableCell align="right">{formatCurrency(p.preco_unitario)}</TableCell>
                              <TableCell align="right">
                                {formatCurrency(p.preco_unitario * p.quantidade)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <Typography variant="h6">
                      Desconto: {formatCurrency(selectedOS.desconto)}
                    </Typography>
                    <Typography variant="h6">
                      Total: {formatCurrency(selectedOS.valor_total)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Atualização de Status */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Atualizar Status da OS #{selectedOS?.id}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              select
              label="Novo Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              fullWidth
            >
              <MenuItem value="Aguardando">Aguardando</MenuItem>
              <MenuItem value="Em Andamento">Em Andamento</MenuItem>
              <MenuItem value="Concluído">Concluído</MenuItem>
              <MenuItem value="Pago">Pago</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveStatus} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Criação de OS */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="md" fullWidth>
        <DialogTitle>Nova Ordem de Serviço</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={(option) => `${option.nome} - ${option.cpf_cnpj}`}
                  value={clientes.find((c) => c.id === formData.cliente_id) || null}
                  onChange={(_, newValue) => {
                    setFormData({ ...formData, cliente_id: newValue?.id });
                  }}
                  renderInput={(params) => <TextField {...params} label="Cliente *" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={veiculos}
                  getOptionLabel={(option) => `${option.placa} - ${option.marca} ${option.modelo}`}
                  value={veiculos.find((v) => v.id === formData.veiculo_id) || null}
                  onChange={(_, newValue) => {
                    setFormData({ ...formData, veiculo_id: newValue?.id });
                  }}
                  renderInput={(params) => <TextField {...params} label="Veículo *" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={mecanicos}
                  getOptionLabel={(option) => option.nome}
                  value={mecanicos.find((m) => m.id === formData.mecanico_id) || null}
                  onChange={(_, newValue) => {
                    setFormData({ ...formData, mecanico_id: newValue?.id });
                  }}
                  renderInput={(params) => <TextField {...params} label="Mecânico *" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Status"
                  value={formData.status || 'Aguardando'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="Aguardando">Aguardando</MenuItem>
                  <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                  <MenuItem value="Concluído">Concluído</MenuItem>
                  <MenuItem value="Pago">Pago</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="Data de Abertura"
                  value={formData.data_abertura || ''}
                  onChange={(e) => setFormData({ ...formData, data_abertura: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descrição do Problema"
                  value={formData.descricao_problema || ''}
                  onChange={(e) => setFormData({ ...formData, descricao_problema: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Observações"
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Seção de Serviços */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">Serviços</Typography>
                  <Button startIcon={<AddIcon />} onClick={handleAddServico} size="small">
                    Adicionar Serviço
                  </Button>
                </Box>
                {formData.servicos && formData.servicos.length > 0 && (
                  <Box>
                    {formData.servicos.map((servico, index) => (
                      <Grid container spacing={2} key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Grid item xs={12} sm={5}>
                          <Autocomplete
                            options={servicos}
                            getOptionLabel={(option) => `${option.nome} - ${formatCurrency(option.preco)}`}
                            value={servicos.find((s) => s.id === servico.servico_id) || null}
                            onChange={(_, newValue) => {
                              const newServicos = [...(formData.servicos || [])];
                              newServicos[index] = {
                                ...newServicos[index],
                                servico_id: newValue?.id || 0,
                                preco_unitario: newValue?.preco ? parseFloat(newValue.preco) : 0,
                              };
                              setFormData({ ...formData, servicos: newServicos });
                            }}                            renderInput={(params) => <TextField {...params} label="Serviço" size="small" />}
                          />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            type="number"
                            label="Quantidade"
                            value={servico.quantidade}
                            onChange={(e) => handleUpdateServico(index, 'quantidade', Number(e.target.value))}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <TextField
                            type="number"
                            label="Preço Unit."
                            value={servico.preco_unitario}
                            onChange={(e) => handleUpdateServico(index, 'preco_unitario', Number(e.target.value))}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              {formatCurrency(servico.quantidade * servico.preco_unitario)}
                            </Typography>
                            <IconButton size="small" color="error" onClick={() => handleRemoveServico(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    ))}
                  </Box>
                )}
              </Grid>

              {/* Seção de Peças */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">Peças</Typography>
                  <Button startIcon={<AddIcon />} onClick={handleAddPeca} size="small">
                    Adicionar Peça
                  </Button>
                </Box>
                {formData.pecas && formData.pecas.length > 0 && (
                  <Box>
                    {formData.pecas.map((peca, index) => (
                      <Grid container spacing={2} key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                        <Grid item xs={12} sm={5}>
                          <Autocomplete
                            options={pecas}
                            getOptionLabel={(option) => `${option.nome} - ${formatCurrency(option.preco_venda)}`}
                            value={pecas.find((p) => p.id === peca.peca_id) || null}
                            onChange={(_, newValue) => {
                              const newPecas = [...(formData.pecas || [])];
                              newPecas[index] = {
                                ...newPecas[index],
                                peca_id: newValue?.id || 0,
                                preco_unitario: newValue?.preco_venda ? parseFloat(newValue.preco_venda) : 0,
                              };
                              setFormData({ ...formData, pecas: newPecas });
                            }}
                            renderInput={(params) => <TextField {...params} label="Peça" size="small" />}
                          />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            type="number"
                            label="Quantidade"
                            value={peca.quantidade}
                            onChange={(e) => handleUpdatePeca(index, 'quantidade', Number(e.target.value))}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <TextField
                            type="number"
                            label="Preço Unit."
                            value={peca.preco_unitario}
                            onChange={(e) => handleUpdatePeca(index, 'preco_unitario', Number(e.target.value))}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              {formatCurrency(peca.quantidade * peca.preco_unitario)}
                            </Typography>
                            <IconButton size="small" color="error" onClick={() => handleRemovePeca(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    ))}
                  </Box>
                )}
              </Grid>

              {/* Desconto e Total */}
              <Grid item xs={12} sm={6}>
                <TextField
                  type="number"
                  label="Desconto (R$)"
                  value={formData.desconto || 0}
                  onChange={(e) => setFormData({ ...formData, desconto: Number(e.target.value) })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <Typography variant="h6">
                    Total: {formatCurrency(
                      (formData.servicos?.reduce((sum, s) => sum + (s.quantidade * s.preco_unitario), 0) || 0) +
                      (formData.pecas?.reduce((sum, p) => sum + (p.quantidade * p.preco_unitario), 0) || 0) -
                      (formData.desconto || 0)
                    )}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancelar</Button>
          <Button onClick={handleSubmitCreate} variant="contained">
            Criar OS
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
