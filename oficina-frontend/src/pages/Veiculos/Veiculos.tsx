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
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Veiculo, VeiculoFormData, Cliente } from '../../types';
import veiculoService from '../../services/veiculoService';
import clienteService from '../../services/clienteService';

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);
  const [formData, setFormData] = useState<VeiculoFormData>({
    cliente_id: 0,
    placa: '',
    marca: '',
    modelo: '',
    ano: undefined,
    cor: '',
    chassi: '',
    km: undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [veiculosData, clientesData] = await Promise.all([
        veiculoService.getAll(),
        clienteService.getAll(),
      ]);
      setVeiculos(veiculosData);
      setClientes(clientesData);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (veiculo?: Veiculo) => {
    if (veiculo) {
      setEditingVeiculo(veiculo);
      setFormData({
        cliente_id: veiculo.cliente_id,
        placa: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano,
        cor: veiculo.cor || '',
        chassi: veiculo.chassi || '',
        km: veiculo.km || undefined,
      });
    } else {
      setEditingVeiculo(null);
      setFormData({
        cliente_id: 0,
        placa: '',
        marca: '',
        modelo: '',
        ano: undefined,
        cor: '',
        chassi: '',
        km: undefined,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingVeiculo(null);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      if (editingVeiculo) {
        console.log('Sending data for update:', formData);
        await veiculoService.update(editingVeiculo.id, formData);
        setSuccess('Veículo atualizado com sucesso!');
      } else {
        console.log('Sending data for create:', formData);
        await veiculoService.create(formData);
        setSuccess('Veículo criado com sucesso!');
      }
      handleCloseDialog();
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao salvar veículo');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este veículo?')) {
      return;
    }

    try {
      setError(null);
      await veiculoService.delete(id);
      setSuccess('Veículo excluído com sucesso!');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.erro || 'Erro ao excluir veículo');
    }
  };

  const handleChange = (field: keyof VeiculoFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const getClienteNome = (clienteId: number) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    return cliente?.nome || 'N/A';
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
        <Typography variant="h4">Veículos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Veículo
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Placa</TableCell>
              <TableCell>Marca/Modelo</TableCell>
              <TableCell>Ano</TableCell>
              <TableCell>KM</TableCell>
              <TableCell>Cor</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {veiculos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum veículo cadastrado
                </TableCell>
              </TableRow>
            ) : (
              veiculos.map((veiculo) => (
                <TableRow key={veiculo.id}>
                  <TableCell>{veiculo.id}</TableCell>
                  <TableCell>{veiculo.placa}</TableCell>
                  <TableCell>{`${veiculo.marca} ${veiculo.modelo}`}</TableCell>
                  <TableCell>{veiculo.ano || '-'}</TableCell>
                  <TableCell>{veiculo.km || '-'}</TableCell>
                  <TableCell>{veiculo.cor || '-'}</TableCell>
                  <TableCell>{getClienteNome(veiculo.cliente_id)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(veiculo)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(veiculo.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Criar/Editar */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingVeiculo ? 'Editar Veículo' : 'Novo Veículo'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Cliente"
              value={formData.cliente_id || ''}
              onChange={(e) => handleChange('cliente_id', Number(e.target.value))}
              required
              fullWidth
            >
              <MenuItem value="">Selecione um cliente</MenuItem>
              {clientes.map((cliente) => (
                <MenuItem key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Placa"
              value={formData.placa}
              onChange={(e) => handleChange('placa', e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Marca"
              value={formData.marca}
              onChange={(e) => handleChange('marca', e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Modelo"
              value={formData.modelo}
              onChange={(e) => handleChange('modelo', e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Ano"
              type="number"
              value={formData.ano || ''}
              onChange={(e) => handleChange('ano', e.target.value ? Number(e.target.value) : undefined)}
              fullWidth
            />
            <TextField
              label="Cor"
              value={formData.cor}
              onChange={(e) => handleChange('cor', e.target.value)}
              fullWidth
            />
            <TextField
              label="Chassi"
              value={formData.chassi}
              onChange={(e) => handleChange('chassi', e.target.value)}
              fullWidth
            />
            <TextField
              label="KM"
              type="number"
              value={formData.km || ''}
              onChange={(e) => handleChange('km', e.target.value ? Number(e.target.value) : undefined)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
