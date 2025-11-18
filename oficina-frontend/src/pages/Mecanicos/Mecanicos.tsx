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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { Mecanico, MecanicoFormData } from '../../types';
import mecanicoService from '../../services/mecanicoService';

export default function Mecanicos() {
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMecanico, setEditingMecanico] = useState<Mecanico | null>(null);
  const [formData, setFormData] = useState<MecanicoFormData>({
    nome: '',
    especialidade: '',
    telefone: '',
    email: '',
  });

  useEffect(() => {
    loadMecanicos();
  }, []);

  const loadMecanicos = async () => {
    try {
      setLoading(true);
      const data = await mecanicoService.getAll();
      setMecanicos(data);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao carregar mecânicos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mecanico?: Mecanico) => {
    if (mecanico) {
      setEditingMecanico(mecanico);
      setFormData({
        nome: mecanico.nome,
        especialidade: mecanico.especialidade,
        telefone: mecanico.telefone,
        email: mecanico.email || '',
      });
    } else {
      setEditingMecanico(null);
      setFormData({ nome: '', especialidade: '', telefone: '', email: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingMecanico) {
        await mecanicoService.update(editingMecanico.id, formData);
        setSuccess('Mecânico atualizado com sucesso!');
      } else {
        await mecanicoService.create(formData);
        setSuccess('Mecânico criado com sucesso!');
      }
      setDialogOpen(false);
      loadMecanicos();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao salvar mecânico');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este mecânico?')) return;
    try {
      await mecanicoService.delete(id);
      setSuccess('Mecânico excluído com sucesso!');
      loadMecanicos();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao excluir mecânico');
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
        <Typography variant="h4">Mecânicos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Novo Mecânico
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
              <TableCell>Especialidade</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mecanicos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Nenhum mecânico cadastrado</TableCell>
              </TableRow>
            ) : (
              mecanicos.map((mecanico) => (
                <TableRow key={mecanico.id}>
                  <TableCell>{mecanico.id}</TableCell>
                  <TableCell>{mecanico.nome}</TableCell>
                  <TableCell>{mecanico.especialidade}</TableCell>
                  <TableCell>{mecanico.telefone}</TableCell>
                  <TableCell>{mecanico.email || '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(mecanico)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(mecanico.id)} color="error">
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
        <DialogTitle>{editingMecanico ? 'Editar Mecânico' : 'Novo Mecânico'}</DialogTitle>
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
              label="Especialidade"
              value={formData.especialidade}
              onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
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
