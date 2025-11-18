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
  Grid,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Warning as WarningIcon } from '@mui/icons-material';
import type { Peca, PecaFormData } from '../../types';
import pecaService from '../../services/pecaService';

export default function Pecas() {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPeca, setEditingPeca] = useState<Peca | null>(null);
  const [formData, setFormData] = useState<PecaFormData>({
    nome: '',
    numero_peca: '',
    descricao: '',
    preco_custo: 0,
    preco_venda: 0,
    quantidade_estoque: 0,
    estoque_minimo: 0,
    localizacao: '',
  });

  useEffect(() => {
    loadPecas();
  }, []);

  const loadPecas = async () => {
    try {
      setLoading(true);
      const data = await pecaService.getAll();
      setPecas(data);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao carregar peças');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (peca?: Peca) => {
    if (peca) {
      setEditingPeca(peca);
      setFormData({
        nome: peca.nome,
        numero_peca: peca.numero_peca,
        descricao: peca.descricao || '',
        preco_custo: peca.preco_custo,
        preco_venda: peca.preco_venda,
        quantidade_estoque: peca.quantidade_estoque,
        estoque_minimo: peca.estoque_minimo,
        localizacao: peca.localizacao || '',
      });
    } else {
      setEditingPeca(null);
      setFormData({
        nome: '',
        numero_peca: '',
        descricao: '',
        preco_custo: 0,
        preco_venda: 0,
        quantidade_estoque: 0,
        estoque_minimo: 0,
        localizacao: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingPeca) {
        await pecaService.update(editingPeca.id, formData);
        setSuccess('Peça atualizada com sucesso!');
      } else {
        await pecaService.create(formData);
        setSuccess('Peça criada com sucesso!');
      }
      setDialogOpen(false);
      loadPecas();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao salvar peça');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta peça?')) return;
    try {
      await pecaService.delete(id);
      setSuccess('Peça excluída com sucesso!');
      loadPecas();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao excluir peça');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const isEstoqueBaixo = (peca: Peca) => peca.quantidade_estoque <= peca.estoque_minimo;

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
        <Typography variant="h4">Peças e Estoque</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Nova Peça
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nº Peça</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Preço Custo</TableCell>
              <TableCell>Preço Venda</TableCell>
              <TableCell>Estoque</TableCell>
              <TableCell>Estoque Mín.</TableCell>
              <TableCell>Localização</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pecas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Nenhuma peça cadastrada</TableCell>
              </TableRow>
            ) : (
              pecas.map((peca) => (
                <TableRow key={peca.id} sx={{ bgcolor: isEstoqueBaixo(peca) ? '#fff3e0' : 'inherit' }}>
                  <TableCell>{peca.numero_peca}</TableCell>
                  <TableCell>
                    {peca.nome}
                    {isEstoqueBaixo(peca) && (
                      <Chip icon={<WarningIcon />} label="Estoque Baixo" color="warning" size="small" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(peca.preco_custo)}</TableCell>
                  <TableCell>{formatCurrency(peca.preco_venda)}</TableCell>
                  <TableCell>
                    <Typography color={isEstoqueBaixo(peca) ? 'error' : 'inherit'} fontWeight={isEstoqueBaixo(peca) ? 'bold' : 'normal'}>
                      {peca.quantidade_estoque}
                    </Typography>
                  </TableCell>
                  <TableCell>{peca.estoque_minimo}</TableCell>
                  <TableCell>{peca.localizacao || '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(peca)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(peca.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingPeca ? 'Editar Peça' : 'Nova Peça'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Número da Peça"
                  value={formData.numero_peca}
                  onChange={(e) => setFormData({ ...formData, numero_peca: e.target.value })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descrição"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  multiline
                  rows={2}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Preço de Custo"
                  type="number"
                  value={formData.preco_custo}
                  onChange={(e) => setFormData({ ...formData, preco_custo: Number(e.target.value) })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Preço de Venda"
                  type="number"
                  value={formData.preco_venda}
                  onChange={(e) => setFormData({ ...formData, preco_venda: Number(e.target.value) })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Quantidade em Estoque"
                  type="number"
                  value={formData.quantidade_estoque}
                  onChange={(e) => setFormData({ ...formData, quantidade_estoque: Number(e.target.value) })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Estoque Mínimo"
                  type="number"
                  value={formData.estoque_minimo}
                  onChange={(e) => setFormData({ ...formData, estoque_minimo: Number(e.target.value) })}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Localização"
                  value={formData.localizacao}
                  onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                  fullWidth
                />
              </Grid>
            </Grid>
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
