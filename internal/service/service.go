package service

type Service struct {
	repo RepositoryI
}

func New(r RepositoryI) *Service {
	return &Service{r}
}
