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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { Servico, ServicoFormData } from '../../types';
import servicoService from '../../services/servicoService';

export default function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [formData, setFormData] = useState<ServicoFormData>({
    nome: '',
    descricao: '',
    preco_padrao: 0,
    tempo_estimado: undefined,
    ativo: true,
  });

  useEffect(() => {
    loadServicos();
  }, []);

  const loadServicos = async () => {
    try {
      setLoading(true);
      const data = await servicoService.getAll();
      setServicos(data);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (servico?: Servico) => {
    if (servico) {
      setEditingServico(servico);
      setFormData({
        nome: servico.nome,
        descricao: servico.descricao || '',
        preco_padrao: servico.preco_padrao,
        tempo_estimado: servico.tempo_estimado,
        ativo: servico.ativo,
      });
    } else {
      setEditingServico(null);
      setFormData({ nome: '', descricao: '', preco_padrao: 0, tempo_estimado: undefined, ativo: true });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingServico) {
        await servicoService.update(editingServico.id, formData);
        setSuccess('Serviço atualizado com sucesso!');
      } else {
        await servicoService.create(formData);
        setSuccess('Serviço criado com sucesso!');
      }
      setDialogOpen(false);
      loadServicos();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao salvar serviço');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
      await servicoService.delete(id);
      setSuccess('Serviço excluído com sucesso!');
      loadServicos();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao excluir serviço');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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
        <Typography variant="h4">Serviços</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Novo Serviço
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Preço Padrão</TableCell>
              <TableCell>Tempo Estimado (min)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {servicos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Nenhum serviço cadastrado</TableCell>
              </TableRow>
            ) : (
              servicos.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell>{servico.id}</TableCell>
                  <TableCell>{servico.nome}</TableCell>
                  <TableCell>{formatCurrency(servico.preco_padrao)}</TableCell>
                  <TableCell>{servico.tempo_estimado || '-'}</TableCell>
                  <TableCell>
                    <Chip label={servico.ativo ? 'Ativo' : 'Inativo'} color={servico.ativo ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(servico)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(servico.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingServico ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Preço Padrão"
              type="number"
              value={formData.preco_padrao}
              onChange={(e) => setFormData({ ...formData, preco_padrao: Number(e.target.value) })}
              required
              fullWidth
            />
            <TextField
              label="Tempo Estimado (minutos)"
              type="number"
              value={formData.tempo_estimado || ''}
              onChange={(e) => setFormData({ ...formData, tempo_estimado: e.target.value ? Number(e.target.value) : undefined })}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                />
              }
              label="Serviço Ativo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
